import Texditor from "@/texditor";
import { CurrentSelectionData, CursorPosition } from "@/types/core";
export default class SelectionAPI {
  private editor: Texditor;
  private currentData: CurrentSelectionData = {
    position: {
      start: 0,
      end: 0
    },
    element: null
  };

  constructor(editor: Texditor) {
    this.editor = editor;
  }

  setCurrent(el: HTMLElement, position: CursorPosition): void {
    this.currentData = {
      element: el,
      position: position
    };
  }

  current(): CurrentSelectionData {
    return this.currentData;
  }

  cleanCurrent(): void {
    this.currentData = {
      position: {
        start: 0,
        end: 0
      },
      element: null
    };
  }

  selectCurrent() {
    const { element, position } = this.current(),
      { start, end } = position;

    if (element) this.select(start, end, element);
  }

  childNodes(node: Node): Node[] {
    const nodes: Node[] = [];

    if (node.nodeType === Node.TEXT_NODE) {
      nodes.push(node);
    } else {
      const childNodes = node.childNodes;

      for (let i = 0, len = childNodes.length; i < len; ++i) {
        nodes.push(...this.childNodes(childNodes[i]));
      }
    }

    return nodes;
  }

  getTextareaCursor(input: HTMLTextAreaElement): CursorPosition {
    if ("selectionStart" in input && document.activeElement === input) {
      return {
        start: input.selectionStart,
        end: input.selectionEnd
      };
    }

    const ieInput = input as HTMLTextAreaElement & {
      createTextRange?: () => {
        moveToBookmark: (bookmark: unknown) => void;
        compareEndPoints: (how: string, sourceRange: unknown) => number;
        moveEnd: (unit: string, count: number) => void;
        setEndPoint: (how: string, sourceRange: unknown) => void;
      };
    };

    const ieDocument = document as Document & {
      selection?: {
        createRange: () => {
          parentElement: () => HTMLElement;
          getBookmark: () => unknown;
        };
      };
    };

    if (ieInput.createTextRange && ieDocument.selection) {
      const sel = ieDocument.selection.createRange();
      if (sel.parentElement() === input) {
        const rng = ieInput.createTextRange();
        rng.moveToBookmark(sel.getBookmark());

        let len = 0;
        while (rng.compareEndPoints("EndToStart", rng) > 0) {
          rng.moveEnd("character", -1);
          len++;
        }

        rng.setEndPoint("StartToStart", ieInput.createTextRange());
        const pos: CursorPosition = { start: 0, end: len };

        while (rng.compareEndPoints("EndToStart", rng) > 0) {
          rng.moveEnd("character", -1);
          pos.start++;
          pos.end++;
        }

        return pos;
      }
    }

    return {
      start: -1,
      end: -1
    };
  }
  select(startPos: number, endPos: number, container?: Element): void {
    const { element } = this.current();
    const wrapContainer = container || element || null;

    if (!wrapContainer) return;

    const textContent = wrapContainer.textContent || "",
      totalLength = textContent.length,
      range = document.createRange(),
      selection = this.getSelection();

    if (!selection) return;

    // // Проверяем валидность позиций
    // if (startPos < 0 || endPos > totalLength || startPos > endPos) {
    //     console.error('Invalid selection positions');
    //     return;
    // }

    // Находим текстовые узлы и их позиции
    let currentPos = 0;
    let startNode: Text | null = null;
    let endNode: Text | null = null;
    let startOffset = 0;
    let endOffset = 0;

    // Рекурсивно обходим все узлы контейнера
    const walker = document.createTreeWalker(wrapContainer, NodeFilter.SHOW_TEXT, null);

    let node: Text | null;
    while ((node = walker.nextNode() as Text | null)) {
      const nodeLength = node.nodeValue?.length || 0;

      // Проверяем начальную позицию
      if (!startNode && currentPos + nodeLength > startPos) {
        startNode = node;
        startOffset = startPos - currentPos;
      }

      // Проверяем конечную позицию (изменили условие для включения endPos = currentPos + nodeLength)
      if (!endNode && currentPos + nodeLength >= endPos) {
        endNode = node;
        endOffset = endPos - currentPos;
        // Если endPos находится точно в конце последнего узла, прерываем цикл
        if (currentPos + nodeLength === endPos) break;
      }

      currentPos += nodeLength;
    }

    // Если endNode не найден, но endPos равен totalLength, используем последний узел
    if (!endNode && endPos === totalLength && currentPos === totalLength) {
      endNode = node; // Последний обработанный узел
      endOffset = endPos - (currentPos - (node?.nodeValue?.length || 0));
    }

    if (startNode && endNode && selection) {
      range.setStart(startNode, startOffset);
      range.setEnd(endNode, endOffset);
    } else {
      if (endNode && startPos === endPos && endPos === totalLength) {
        const endNodeLength = endNode?.textContent?.length;
        range.setStart(endNode, endNodeLength || 0);
        range.setEnd(endNode, endNodeLength || 0);
      }
    }

    selection.removeAllRanges();
    selection.addRange(range);
  }

  insertText(content: string, cleanHtml = true): boolean {
    const selection = this.getSelection();
    const activeElement = document.activeElement as HTMLElement;

    // Для contenteditable и других элементов
    if (activeElement?.isContentEditable && selection && selection.rangeCount > 0) {
      const range = this.getRange();
      if (!range) return false;

      range.deleteContents();
      const div = document.createElement("div");
      div.innerHTML = content;

      range.insertNode(document.createTextNode(cleanHtml ? div.textContent || "" : content));

      return true;
    }

    return false;
  }

  splitContent(container?: HTMLElement | null): string {
    const selection = this.getSelection();

    if (!selection || selection.rangeCount === 0) return "";

    const range = selection.getRangeAt(0);
    const currentParagraph = container ? container : this.editor.blockManager.getCurrentBlock();

    if (!currentParagraph) return "";

    const newBlock = document.createElement("div");
    newBlock.innerHTML = "";

    if (range.startContainer.nodeType === Node.TEXT_NODE) {
      const textNode = range.startContainer;
      const parent = textNode.parentNode!;
      const textContent = textNode.textContent || "";
      const beforeText = textContent.substring(0, range.startOffset);
      const afterText = textContent.substring(range.startOffset);

      textNode.textContent = beforeText;

      if (parent !== currentParagraph) {
        let currentNode: Node = textNode;
        const parents: Node[] = [];

        while (currentNode && currentNode !== currentParagraph && currentNode.parentNode !== currentParagraph) {
          parents.push(currentNode.parentNode!);
          currentNode = currentNode.parentNode!;
        }

        let newStructure: Node = document.createTextNode(afterText);

        parents.forEach((p) => {
          const newParent = p.cloneNode(false);
          newParent.appendChild(newStructure);
          newStructure = newParent;
        });

        newBlock.appendChild(newStructure);

        let nextSibling = parent.nextSibling;
        while (nextSibling) {
          newBlock.appendChild(nextSibling.cloneNode(true));
          parent.parentNode?.removeChild(nextSibling);
          nextSibling = parent.nextSibling;
        }
      } else {
        if (afterText) {
          newBlock.textContent = afterText;
        }

        let nextSibling = textNode.nextSibling;
        while (nextSibling) {
          newBlock.appendChild(nextSibling.cloneNode(true));
          currentParagraph.removeChild(nextSibling);
          nextSibling = textNode.nextSibling;
        }
      }
    } else {
      const nodesToMove = [];
      let node = range.startContainer.childNodes[range.startOffset];
      while (node) {
        nodesToMove.push(node.cloneNode(true));
        range.startContainer.removeChild(node);
        node = range.startContainer.childNodes[range.startOffset];
      }

      nodesToMove.forEach((node) => newBlock.appendChild(node));
    }

    return newBlock?.innerHTML.trim();
  }

  findTags(container: Element | HTMLElement, childrens: boolean = true): HTMLElement[] {
    const selection = this.getSelection();

    if (!selection || selection.rangeCount === 0) return [];

    const range = selection.getRangeAt(0);
    const selectedTags: HTMLElement[] = [];

    // Проверяем, что выделение вообще внутри container
    if (!container.contains(range.commonAncestorContainer)) {
      return [];
    }

    // Рекурсивно проверяем дочерние элементы (но не сам container)
    const checkElement = (element: HTMLElement) => {
      const elementRange = document.createRange();
      elementRange.selectNode(element);

      const isIntersecting =
        (range.compareBoundaryPoints(Range.START_TO_START, elementRange) <= 0 &&
          range.compareBoundaryPoints(Range.END_TO_END, elementRange) >= 0) ||
        range.intersectsNode(element);

      if (isIntersecting && element !== container) {
        selectedTags.push(element);
      }

      if (childrens) {
        for (const child of Array.from(element.children)) {
          checkElement(child as HTMLElement);
        }
      }
    };

    // Начинаем с детей container (не включая его самого)
    Array.from(container.children).forEach((child) => {
      checkElement(child as HTMLElement);
    });

    return selectedTags;
  }

  getSelection(): Selection | null {
    return window.getSelection() || null;
  }

  getRange(index: number = 0): Range | null {
    const selection: Selection | null = this.getSelection();

    if (!selection) return null;

    if (selection.rangeCount === 0) return null;

    return selection.getRangeAt(index);
  }

  getAbsoluteOffset(container: Node, offset: number) {
    if (container.nodeType === Node.TEXT_NODE) {
      return offset;
    }

    let absoluteOffset = 0;
    for (let i = 0, len = Math.min(container.childNodes.length, offset); i < len; i++) {
      const childNode = container.childNodes[i];

      this.searchNode(childNode, childNode, (node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          absoluteOffset += (node as Text).data.length;
        }

        return false;
      });
    }

    return absoluteOffset;
  }

  private searchNode(
    container: Node,
    startNode: Node,
    predicate: (node: Node) => boolean,
    excludeSibling?: boolean
  ): boolean {
    if (predicate(startNode as Text)) {
      return true;
    }

    for (let i = 0, len = startNode.childNodes.length; i < len; i++) {
      if (this.searchNode(startNode, startNode.childNodes[i], predicate, true)) {
        return true;
      }
    }

    if (!excludeSibling) {
      let parentNode: Node | ParentNode | null = startNode;

      if (parentNode) {
        while (parentNode && parentNode !== container) {
          let nextSibling = parentNode.nextSibling;
          while (nextSibling) {
            if (this.searchNode(container, nextSibling, predicate, true)) {
              return true;
            }

            nextSibling = nextSibling.nextSibling;
          }

          parentNode = parentNode.parentNode;
        }
      }
    }

    return false;
  }

  getOffset(container?: Node | HTMLElement | null): [number, number] {
    const range = this.getRange();
    const { element } = this.current();
    const wrapContainer = container || element || null;

    if (!range || !wrapContainer) {
      return [-1, -1];
    }

    const containerText = wrapContainer.textContent || "",
      containerLength = containerText.length,
      containerRange = document.createRange();

    containerRange.selectNodeContents(wrapContainer);

    if (
      range.compareBoundaryPoints(Range.START_TO_START, containerRange) >= 0 &&
      range.compareBoundaryPoints(Range.END_TO_END, containerRange) <= 0
    ) {
      if (
        range.startContainer === wrapContainer &&
        range.startOffset === 0 &&
        range.endContainer === wrapContainer &&
        range.endOffset === containerLength
      ) {
        return [0, containerLength];
      }

      const startRange = document.createRange();
      startRange.setStart(wrapContainer, 0);
      startRange.setEnd(range.startContainer, range.startOffset);
      const start = startRange.toString().length;

      const endRange = document.createRange();
      endRange.setStart(wrapContainer, 0);
      endRange.setEnd(range.endContainer, range.endOffset);
      const end = endRange.toString().length;

      return [start, end];
    }

    let start = 0;
    let end = containerLength;

    if (range.compareBoundaryPoints(Range.START_TO_START, containerRange) < 0) {
      // Выделение начинается до контейнера → start = 0
      start = 0;
    } else {
      // Выделение внутри контейнера → вычисляем start
      const startRange = document.createRange();
      startRange.setStart(wrapContainer, 0);
      startRange.setEnd(range.startContainer, range.startOffset);
      start = startRange.toString().length;
    }

    if (range.compareBoundaryPoints(Range.END_TO_END, containerRange) > 0) {
      // Выделение заканчивается после контейнера → end = containerLength
      end = containerLength;
    } else {
      // Выделение внутри контейнера → вычисляем end
      const endRange = document.createRange();
      endRange.setStart(wrapContainer, 0);
      endRange.setEnd(range.endContainer, range.endOffset);
      end = endRange.toString().length;
    }

    return [start, end];
  }

  getOffsetOld(container?: Node | HTMLElement | null): [number, number] {
    const range = this.getRange(),
      { element } = this.current(),
      wrapContainer = container || element || null;

    if (!range) return [-1, -1];

    let start = range.startOffset,
      end = range.endOffset;

    if (!wrapContainer) {
      return [start, end];
    }

    const containerText = wrapContainer.textContent || "";
    const containerLength = containerText.length;
    const containerRange = document.createRange();
    containerRange.selectNodeContents(wrapContainer);

    // Проверяем, пересекается ли выделение с контейнером
    const startsBefore =
      range.startContainer === wrapContainer ||
      wrapContainer.contains(range.startContainer) ||
      range.startContainer.compareDocumentPosition(wrapContainer) & Node.DOCUMENT_POSITION_CONTAINS;
    const endsAfter =
      range.endContainer === wrapContainer ||
      wrapContainer.contains(range.endContainer) ||
      range.endContainer.compareDocumentPosition(wrapContainer) & Node.DOCUMENT_POSITION_CONTAINS;

    if (!startsBefore && !endsAfter) {
      // Выделение полностью вне контейнера
      return [-1, -1];
    }

    // Если начало выделения до контейнера
    if (!startsBefore) {
      start = 0;
    } else if (range.startContainer !== wrapContainer) {
      // Если начало внутри дочернего элемента контейнера
      const startRange = document.createRange();
      startRange.setStart(wrapContainer, 0);
      startRange.setEnd(range.startContainer, range.startOffset);
      start = startRange.toString().length;
    }

    // Если конец выделения после контейнера
    if (!endsAfter) {
      end = containerLength;
    } else if (range.endContainer !== wrapContainer) {
      // Если конец внутри дочернего элемента контейнера
      const endRange = document.createRange();
      endRange.setStart(wrapContainer, 0);
      endRange.setEnd(range.endContainer, range.endOffset);
      end = endRange.toString().length;
    }

    return [start, end];
  }

  // getOffsetOld(container?: Node | HTMLElement | null): [number, number] {
  //     let start = 0,
  //         end = 0;

  //     const cnt = container ? container : this.editor.blockManager.getCurrentBlock();

  //     if (!cnt)
  //         return [0, 0];

  //     const selection = this.getSelection()
  //     for (let i = 0, len = selection?.rangeCount || 0; i < len; i++) {
  //         const range = selection?.getRangeAt(i);

  //         if (range?.intersectsNode(cnt)) {
  //             const startNode = range.startContainer;

  //             this.searchNode(cnt, cnt, node => {
  //                 if (startNode === node) {
  //                     start += this.getAbsoluteOffset(node, range.startOffset)
  //                     return true
  //                 }

  //                 const dataLength = node.nodeType === Node.TEXT_NODE
  //                     ? (node as Text).data.length
  //                     : 0

  //                 start += dataLength;
  //                 end += dataLength;

  //                 return false;
  //             })

  //             const endNode = range.endContainer;

  //             this.searchNode(cnt, startNode, node => {
  //                 if (endNode === node) {
  //                     end += this.getAbsoluteOffset(node, range.endOffset)
  //                     return true;
  //                 }

  //                 const dataLength = node.nodeType === Node.TEXT_NODE
  //                     ? (node as Text).data.length
  //                     : 0;

  //                 end += dataLength;

  //                 return false;
  //             })

  //             break;
  //         }
  //     }

  //     return [start, end]
  // }

  getBounds(): DOMRect | null {
    const range = this.getRange();

    if (!range) return null;

    return range.getBoundingClientRect();
  }

  getFirstLineBounds(): DOMRect | null {
    const originalRange = this.getRange();

    if (!originalRange) return null;

    const tempRange = document.createRange();
    tempRange.setStart(originalRange.startContainer, originalRange.startOffset);
    tempRange.setEnd(originalRange.startContainer, originalRange.startOffset);

    const rect = tempRange.getBoundingClientRect();

    if (rect.width === 0 || rect.height === 0) {
      const clientRects = originalRange.getClientRects();

      if (clientRects.length > 0) {
        return clientRects[0];
      }
    }

    return rect;
  }
}
