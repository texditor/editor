import type {
  CurrentSelectionData,
  CursorPosition,
  TexditorInterface
} from "@/types";
export default class SelectionAPI {
  private editor: TexditorInterface;
  private currentData: CurrentSelectionData = {
    position: {
      start: 0,
      end: 0
    },
    element: null
  };

  constructor(editor: TexditorInterface) {
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

  select(
    startPos: number,
    endPos: number,
    container?: Element,
    scrollToContainer: boolean = false
  ): void {
    const { element } = this.current();
    const wrapContainer = container || element || null;

    if (!wrapContainer) return;

    const textContent = wrapContainer.textContent || "";
    const totalLength = textContent.length;
    const validStartPos = Math.max(0, Math.min(startPos, totalLength));
    const validEndPos = Math.max(validStartPos, Math.min(endPos, totalLength));
    const range = document.createRange();
    const selection = this.getSelection();

    if (!selection) return;

    let currentPos = 0;
    let startNode: Text | null = null;
    let endNode: Text | null = null;
    let startOffset = 0;
    let endOffset = 0;

    const walker = document.createTreeWalker(
      wrapContainer,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          return node.textContent?.length
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT;
        }
      }
    );

    let node: Text | null;
    const textNodes: Text[] = [];

    while ((node = walker.nextNode() as Text | null)) {
      textNodes.push(node);
    }

    for (const textNode of textNodes) {
      const nodeLength = textNode.textContent?.length || 0;

      if (!startNode && currentPos + nodeLength > validStartPos) {
        startNode = textNode;
        startOffset = validStartPos - currentPos;
      }

      if (!endNode && currentPos + nodeLength >= validEndPos) {
        endNode = textNode;
        endOffset = validEndPos - currentPos;
        break;
      }

      currentPos += nodeLength;
    }

    if (!startNode) {
      const lastNode = textNodes[textNodes.length - 1];
      if (lastNode) {
        startNode = lastNode;
        startOffset = lastNode.textContent?.length || 0;
      }
    }

    if (!endNode) {
      const lastNode = textNodes[textNodes.length - 1];
      if (lastNode) {
        endNode = lastNode;
        endOffset = lastNode.textContent?.length || 0;
      }
    }

    if (startNode && endNode) {
      try {
        range.setStart(startNode, Math.min(startOffset, startNode.textContent?.length || 0));
        range.setEnd(endNode, Math.min(endOffset, endNode.textContent?.length || 0));
      } catch (e) {
        console.warn('Error setting range:', e);
        return;
      }
    } else {
      return;
    }

    if (container && scrollToContainer) {
      container.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    selection.removeAllRanges();
    selection.addRange(range);
  }

  insertText(content: string, stripTags = true): boolean {
    const selection = this.getSelection(),
      activeElement = document.activeElement as HTMLElement;

    if (
      activeElement?.isContentEditable &&
      selection &&
      selection.rangeCount > 0
    ) {
      const range = this.getRange();
      if (!range) return false;

      range.deleteContents();
      const div = document.createElement("div");
      div.innerHTML = content;

      range.insertNode(
        document.createTextNode(stripTags ? div.textContent || "" : content)
      );

      return true;
    }

    return false;
  }

  splitContent(container?: HTMLElement | null): string {
    const selection = this.getSelection();

    if (!selection || selection.rangeCount === 0) return "";

    const range = selection.getRangeAt(0);
    const currentParagraph = container
      ? container
      : this.editor.blockManager.getBlockNode();

    if (!currentParagraph) return "";

    const newBlock = document.createElement("div");
    newBlock.innerHTML = "";

    if (range.startContainer.nodeType === Node.TEXT_NODE) {
      const textNode = range.startContainer,
        parent = textNode.parentNode!,
        textContent = textNode.textContent || "",
        beforeText = textContent.substring(0, range.startOffset),
        afterText = textContent.substring(range.startOffset);

      textNode.textContent = beforeText;

      if (parent !== currentParagraph) {
        let currentNode: Node = textNode;
        const parents: Node[] = [];

        while (
          currentNode &&
          currentNode !== currentParagraph &&
          currentNode.parentNode !== currentParagraph
        ) {
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

  findTags(
    container: Element | HTMLElement,
    childrens: boolean = true
  ): HTMLElement[] {
    const selection = this.getSelection();

    if (!selection || selection.rangeCount === 0) return [];

    const range = selection.getRangeAt(0);
    const selectedTags: HTMLElement[] = [];

    if (!container.contains(range.commonAncestorContainer)) {
      return [];
    }

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
    for (
      let i = 0, len = Math.min(container.childNodes.length, offset);
      i < len;
      i++
    ) {
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
      if (
        this.searchNode(startNode, startNode.childNodes[i], predicate, true)
      ) {
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

    if (
      !range ||
      !wrapContainer ||
      range.startContainer.ownerDocument !== wrapContainer.ownerDocument
    ) {
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
      start = 0;
    } else {
      const startRange = document.createRange();
      startRange.setStart(wrapContainer, 0);
      startRange.setEnd(range.startContainer, range.startOffset);
      start = startRange.toString().length;
    }

    if (range.compareBoundaryPoints(Range.END_TO_END, containerRange) > 0) {
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
