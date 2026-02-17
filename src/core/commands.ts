import type {
  CommandsInterface,
  SelectionAPIInterface,
  TexditorInterface
} from "@/types";
import { isEmptyString } from "@/utils/string";
import { closest, mergeAdjacentTextNodes, query } from "@/utils/dom";
export default class Commands implements CommandsInterface {
  private editor: TexditorInterface;
  static DIR_LEFT: string = "LEFT"; // ( .|.~ <b>...<-|...</b> )
  static DIR_LEFT_SPACE: string = "LEFT_SPACE"; // ( ...|_<b>...<-|...</b> )
  static DIR_RIGHT: string = "RIGHT"; // ( <b>...|->...</b> ~.|. )
  static DIR_RIGHT_SPACE: string = "RIGHT_SPACE"; // ( <b>...|->...</b>_|... )
  static DIR_FULL: string = "FULL"; // ( <b>|......|</b> )
  static DIR_FULL_SPACE: string = "FULL_SPACE"; // ( |_<b>......</b>_| )
  static DIR_FULL_SPACE_LEFT: string = "FULL_SPACE_LEFT"; // ( |_<b>......|</b> )
  static DIR_FULL_SPACE_RIGHT: string = "FULL_SPACE_RIGHT"; // ( <b>|......</b>_| )
  static DIR_INSIDE: string = "INSIDE"; // ( <b>|->.<-|->....<-|->.<-|</b> )
  static DIR_MULTIPLE_INSIDE_TO_INSIDE: string = "MULTIPLE_INSIDE_TO_INSIDE"; // ( <b>~|~</b>...<b>~|~</b> )
  static DIR_MULTIPLE_INSIDE_TO_PARENT_INSIDE: string =
    "MULTIPLE_INSIDE_TO_PARENT_INSIDE"; // ( <b>~|~</b>...<i><b>~|~</b</i> )
  static DIR_MULTIPLE_INSIDE_TO_RIGHT: string = "MULTIPLE_INSIDE_TO_RIGHT"; // ( <b>~|~</b>...<b>...</b~|~ )
  static DIR_MULTIPLE_INSIDE_TO_LEFT: string = "MULTIPLE_INSIDE_TO_LEFT"; // ( ~|~<b>...</b>...<b>~|~</b )
  static DIR_OUTSIDE: string = "OUTSIDE"; // ( |~ <b>......</b>.~.| )
  static DIR_MULTIPLE_OUTSIDE: string = "MULTIPLE_OUTSIDE"; // ( ~ | ~ <b>...</b>...<b>...</b> ~ | ~ )
  static DIR_NONE: null = null; // ( |......| )
  static DIR_IGNORE: string = "IGNORE";

  constructor(editor: TexditorInterface) {
    this.editor = editor;
  }

  formatTextRange(
    tagName: string,
    startOffset: number,
    endOffset: number,
    container: HTMLElement
  ): void {
    let pos = 0;
    const nodes: { node: Text; start: number; end: number }[] = [],
      collectNodes = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
          const length = node.textContent.length;
          nodes.push({
            node: node as Text,
            start: pos,
            end: pos + length
          });
          pos += length;
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          Array.from(node.childNodes).forEach((child) => {
            collectNodes(child);
          });
        }
      };

    collectNodes(container);

    const startNode = nodes.find(
        (n) => startOffset >= n.start && startOffset < n.end
      ),
      endNode = nodes.find((n) => endOffset > n.start && endOffset <= n.end);

    if (!startNode || !endNode) {
      console.error("Invalid selection range");
      return;
    }

    const range = document.createRange();
    range.setStart(startNode.node, startOffset - startNode.start);
    range.setEnd(endNode.node, endOffset - endNode.start);

    if (range.toString().trim() === "") {
      console.error("Empty text selection");
      return;
    }

    const content = range.extractContents(),
      wrapper = document.createElement(tagName),
      innerTags = content.querySelectorAll(tagName);

    innerTags.forEach((tag) => {
      while (tag.firstChild) {
        tag.parentNode?.insertBefore(tag.firstChild, tag);
      }

      tag.parentNode?.removeChild(tag);
    });

    wrapper.appendChild(content);
    range.insertNode(wrapper);
    this.normalize();
  }

  format(tagName: string, focus: boolean = false) {
    this.selection(() => {
      const dir = this.getSelectionDirection(tagName),
        isRemove =
          dir === Commands.DIR_FULL ||
          dir === Commands.DIR_FULL_SPACE ||
          dir === Commands.DIR_FULL_SPACE_LEFT ||
          dir === Commands.DIR_FULL_SPACE_RIGHT ||
          dir === Commands.DIR_INSIDE ||
          dir === Commands.DIR_OUTSIDE;

      if (isRemove) {
        this.removeFormat(tagName, true);
      } else {
        if (dir === Commands.DIR_NONE) {
          this.createFormat(tagName);
        } else if (
          dir === Commands.DIR_RIGHT ||
          dir === Commands.DIR_RIGHT_SPACE ||
          dir === Commands.DIR_LEFT ||
          dir === Commands.DIR_LEFT_SPACE
        ) {
          this.removeFormat(tagName, true);
          this.createFormat(tagName);
        } else if (
          dir === Commands.DIR_MULTIPLE_INSIDE_TO_RIGHT ||
          dir === Commands.DIR_MULTIPLE_INSIDE_TO_LEFT ||
          dir === Commands.DIR_MULTIPLE_INSIDE_TO_INSIDE ||
          dir === Commands.DIR_MULTIPLE_INSIDE_TO_PARENT_INSIDE
        ) {
          this.createFormat(tagName);
        } else {
          this.removeFormat(tagName, true);
        }
      }

      this.normalize();
    }, focus);
  }

  normalize(container?: HTMLElement) {
    const { selectionApi } = this.editor,
      { element } = selectionApi.current();

    const elem = container ? container : element;

    if (elem) {
      const elements: HTMLElement[] = [];

      query(
        "*",
        (el: HTMLElement) => {
          elements.push(el);
          this.removeEmptyTags(elem, el.localName);
          this.flattenNestedSimilarTags(el);
        },
        elem
      );

      this.mergeAdjacentTags(elem);

      elements.forEach((el: HTMLElement) => {
        mergeAdjacentTextNodes(el);
      });

      elem.normalize();
    }
  }

  createFormat(tagName: string) {
    this.selection(
      ({ selectionApi }: { selectionApi: SelectionAPIInterface }) => {
        const { element, position } = selectionApi.current();

        if (element) {
          this.formatTextRange(tagName, position.start, position.end, element);
        }
      }
    );
  }

  removeFormat(
    tagName: string,
    focus: boolean = false,
    normalize: boolean = true
  ): void {
    this.selection(
      ({
        selectionApi
      }: {
        range: Range;
        selectionApi: SelectionAPIInterface;
      }) => {
        const elements = this.findTags(tagName),
          direction = this.getSelectionDirection(tagName),
          isMultiple =
            direction === Commands.DIR_MULTIPLE_OUTSIDE ||
            direction === Commands.DIR_MULTIPLE_INSIDE_TO_INSIDE ||
            direction === Commands.DIR_MULTIPLE_INSIDE_TO_LEFT ||
            direction === Commands.DIR_MULTIPLE_INSIDE_TO_RIGHT,
          clearFull = (el: HTMLElement | HTMLElement[]) => {
            if (Array.isArray(el))
              el.forEach((item: HTMLElement) => clearFull(item));
            else {
              const splited = this.splitElement(
                el,
                0,
                el?.textContent?.length || 0
              );
              el.parentNode?.insertBefore(splited[1], el);
              el.parentElement?.removeChild(el);
            }
          },
          clearLeft = (el: HTMLElement) => {
            const { isEmptyLastChar, lastChar } = this.getEdgeChars(
              el?.textContent || ""
            );

            if (isEmptyLastChar && lastChar.length) {
              el?.insertAdjacentText("afterend", " ");
            }

            const offset = selectionApi.getOffset(el),
              splited = this.splitElement(el, 0, offset[1]);

            el.parentNode?.insertBefore(splited[1], el);

            if (!isEmptyString(splited[2].textContent || ""))
              el.parentNode?.insertBefore(splited[2], el);

            el.parentElement?.removeChild(el);
          },
          clearRight = (el: HTMLElement) => {
            const [start] = selectionApi.getOffset(el),
              splited = this.splitElement(
                el,
                start,
                el?.textContent?.length || 0
              );

            if (!isEmptyString(splited[0].textContent || ""))
              el.parentNode?.insertBefore(splited[0], el);

            el.parentNode?.insertBefore(splited[1], el);
            el.parentElement?.removeChild(el);
          };

        if (elements.length === 1 && !isMultiple) {
          const element = elements[0];

          if (
            direction === Commands.DIR_FULL ||
            direction === Commands.DIR_FULL_SPACE ||
            direction === Commands.DIR_FULL_SPACE_LEFT ||
            direction === Commands.DIR_FULL_SPACE_RIGHT ||
            direction === Commands.DIR_OUTSIDE
          ) {
            clearFull(element);
          } else if (
            direction === Commands.DIR_LEFT ||
            direction === Commands.DIR_LEFT_SPACE
          ) {
            clearLeft(element);
          } else if (
            direction === Commands.DIR_RIGHT ||
            direction === Commands.DIR_RIGHT_SPACE
          ) {
            clearRight(element);
          } else if (direction === Commands.DIR_INSIDE) {
            const [start, end] = selectionApi.getOffset(element),
              splited = this.splitElement(element, start, end);

            splited.forEach((item: HTMLElement | DocumentFragment) => {
              if (!isEmptyString(item?.textContent || "")) {
                element.parentNode?.insertBefore(item, element);
              } else {
                if ((item?.textContent || "").length > 0) {
                  element.parentNode?.insertBefore(
                    document.createTextNode(" "),
                    element
                  );
                }
              }
            });

            element.parentElement?.removeChild(element);
          }
        } else if (elements.length > 1 && isMultiple) {
          if (direction === Commands.DIR_MULTIPLE_OUTSIDE) {
            clearFull(elements);
          } else {
            const cloneElements: HTMLElement[] = elements;

            const firstElement = cloneElements.shift(),
              lastElement = cloneElements.pop();

            clearFull(cloneElements);

            if (direction === Commands.DIR_MULTIPLE_INSIDE_TO_LEFT) {
              if (firstElement) clearFull(firstElement);

              if (lastElement) clearLeft(lastElement);
            } else if (direction === Commands.DIR_MULTIPLE_INSIDE_TO_RIGHT) {
              if (lastElement) clearFull(lastElement);

              if (firstElement) clearRight(firstElement);
            } else if (direction === Commands.DIR_MULTIPLE_INSIDE_TO_INSIDE) {
              if (lastElement) clearLeft(lastElement);

              if (firstElement) clearRight(firstElement);
            }
          }
        }

        if (normalize) this.normalize();
      },
      focus
    );
  }

  replaceEmptyEdges(el: HTMLElement, item?: HTMLElement | Node) {
    const { isEmptyFirstChar, isEmptyLastChar } = this.getEdgeChars(
      (item || el)?.textContent || ""
    );

    if (isEmptyFirstChar) {
      el.parentNode?.insertBefore(document.createTextNode(" "), el);
    }

    if (isEmptyLastChar) {
      el.parentNode?.insertBefore(document.createTextNode(" "), el);
    }
  }

  public clearAllFormatting(normalize: boolean = true): void {
    this.findTags().forEach((el: HTMLElement) => {
      this.removeFormat(el.localName, true, normalize);
    });
  }

  findTags(tagName: string | boolean = false, childrens: boolean = true) {
    const { selectionApi } = this.editor,
      curent = selectionApi.current();

    if (!curent?.element) return [];

    const selectedTags = selectionApi.findTags(curent?.element, childrens);

    if (tagName === false) return selectedTags || [];

    return selectedTags.filter((el: HTMLElement) => el.localName === tagName);
  }

  getSelectionDirection(tagName: string | HTMLElement): string | null {
    let direction = Commands.DIR_IGNORE,
      element: HTMLElement | null = null,
      tags: HTMLElement[] = [];

    if (typeof tagName === "string") {
      tags = this.findTags(tagName);

      if (tags.length) element = tags[0];
    } else element = tagName;

    if (!element) return Commands.DIR_NONE;

    const tagsNotChilds = this.findTags(element.localName, false);

    this.selection(
      ({ range }: { range: Range; selectionApi: SelectionAPIInterface }) => {
        const { startContainer, endContainer } = range;

        const isFullSelection = (): boolean => {
          const fullRange = document.createRange();
          fullRange.selectNodeContents(element);

          const startComparison = range.compareBoundaryPoints(
            Range.START_TO_START,
            fullRange
          );

          return (
            fullRange.startOffset === 0 &&
            (startComparison === -1 || startComparison === 1) &&
            range.toString().trim() === element.textContent?.trim()
          );
        };

        const startsInside =
          element.contains(startContainer) &&
          !(startContainer === element && range.startOffset === 0);

        const endsInside =
          element.contains(endContainer) &&
          !(
            endContainer === element &&
            range.endOffset === element.childNodes.length
          );

        const str = range.toString(),
          { isEmptyFirstChar, isEmptyLastChar, lastChar } =
            this.getEdgeChars(str);

        if (isFullSelection()) {
          direction = Commands.DIR_FULL;

          if (isEmptyFirstChar && isEmptyLastChar) direction += "_SPACE";
          else if (isEmptyFirstChar) direction += "_SPACE_LEFT";
          else if (isEmptyLastChar) direction += "_SPACE_RIGHT";
        } else if (startsInside && endsInside) {
          direction = Commands.DIR_INSIDE;
        } else if (startsInside && !endsInside) {
          let multipleType = null;

          if (tags.length > 1) {
            if (
              closest(startContainer.parentNode, element) &&
              !closest(endContainer.parentNode, tags[tags.length - 1])
            ) {
              multipleType = Commands.DIR_MULTIPLE_INSIDE_TO_RIGHT;
            } else {
              multipleType =
                tagsNotChilds.length > 1
                  ? Commands.DIR_MULTIPLE_INSIDE_TO_INSIDE
                  : Commands.DIR_MULTIPLE_INSIDE_TO_PARENT_INSIDE;
            }
          }

          direction = multipleType
            ? multipleType
            : isEmptyString(lastChar)
              ? Commands.DIR_RIGHT_SPACE
              : Commands.DIR_RIGHT;
        } else if (!startsInside && endsInside) {
          direction = isEmptyFirstChar ? "LEFT_SPACE" : Commands.DIR_LEFT;
        } else if (!startsInside && !endsInside && tags.length > 1) {
          direction = Commands.DIR_MULTIPLE_OUTSIDE;

          if (
            !closest(startContainer.parentNode, element) &&
            closest(endContainer.parentNode, tags[tags.length - 1])
          ) {
            direction = Commands.DIR_MULTIPLE_INSIDE_TO_LEFT;
          }
        } else if (tags.length > 0) {
          direction = Commands.DIR_OUTSIDE;
        }
      }
    );

    return direction;
  }

  flattenNestedSimilarTags(parentElement: HTMLElement): void {
    const parentTag = parentElement.tagName.toLowerCase(),
      processChildren = (element: HTMLElement) => {
        Array.from(element.children).forEach((child) => {
          if (child.tagName.toLowerCase() === parentTag) {
            processChildren(child as HTMLElement);

            const textContent = child.textContent || "",
              textNode = document.createTextNode(textContent);

            child.parentNode?.replaceChild(textNode, child);
          } else {
            processChildren(child as HTMLElement);
          }
        });
      };

    processChildren(parentElement);
  }

  splitElement(
    element: HTMLElement,
    startIndex: number,
    endIndex: number
  ): [HTMLElement, DocumentFragment, HTMLElement] {
    const beforeElement = element.cloneNode(false) as HTMLElement,
      afterElement = element.cloneNode(false) as HTMLElement,
      middleFragment = document.createDocumentFragment();

    let globalIndex = 0;
    const nodesToProcess = Array.from(element.childNodes);

    for (const node of nodesToProcess) {
      const nodeText = node.textContent || "",
        nodeLength = nodeText.length;

      if (globalIndex + nodeLength <= startIndex) {
        beforeElement.appendChild(node.cloneNode(true));
        globalIndex += nodeLength;
        continue;
      }

      if (globalIndex >= endIndex) {
        afterElement.appendChild(node.cloneNode(true));
        globalIndex += nodeLength;
        continue;
      }

      let remainingNode: Node | null = node.cloneNode(true);

      if (globalIndex < startIndex) {
        const splitPos = startIndex - globalIndex,
          [beforePart, middlePart] = this.splitNodeAtTextPosition(
            remainingNode,
            splitPos
          );
        beforeElement.appendChild(beforePart);
        remainingNode = middlePart;
        globalIndex = startIndex;
      }

      const remainingLength = endIndex - globalIndex;
      if (remainingLength > 0 && remainingNode) {
        if (this.getNodeTextLength(remainingNode) <= remainingLength) {
          middleFragment.appendChild(remainingNode);
          globalIndex += this.getNodeTextLength(remainingNode);
          remainingNode = null;
        } else {
          const [middlePart, afterPart] = this.splitNodeAtTextPosition(
            remainingNode,
            remainingLength
          );
          middleFragment.appendChild(middlePart);
          afterElement.appendChild(afterPart);
          globalIndex = endIndex;
          remainingNode = null;
        }
      }

      if (remainingNode) {
        afterElement.appendChild(remainingNode);
        globalIndex += this.getNodeTextLength(remainingNode);
      }
    }

    return [beforeElement, middleFragment, afterElement];
  }

  private splitNodeAtTextPosition(node: Node, position: number): [Node, Node] {
    if (position <= 0)
      return [document.createDocumentFragment(), node.cloneNode(true)];

    const nodeText = node.textContent || "";
    if (position >= nodeText.length)
      return [node.cloneNode(true), document.createDocumentFragment()];

    if (node.nodeType === Node.TEXT_NODE) {
      const textNode = node as Text;
      const beforeText = textNode.textContent?.substring(0, position) || "";
      const afterText = textNode.textContent?.substring(position) || "";
      return [
        document.createTextNode(beforeText),
        document.createTextNode(afterText)
      ];
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      const beforeElement = element.cloneNode(false) as HTMLElement;
      const afterElement = element.cloneNode(false) as HTMLElement;

      let remainingPosition = position;
      for (const child of Array.from(element.childNodes)) {
        if (remainingPosition <= 0) {
          afterElement.appendChild(child.cloneNode(true));
          continue;
        }

        const childLength = this.getNodeTextLength(child);
        if (childLength <= remainingPosition) {
          beforeElement.appendChild(child.cloneNode(true));
          remainingPosition -= childLength;
        } else {
          const [beforePart, afterPart] = this.splitNodeAtTextPosition(
            child,
            remainingPosition
          );
          beforeElement.appendChild(beforePart);
          afterElement.appendChild(afterPart);
          remainingPosition = 0;
        }
      }

      return [beforeElement, afterElement];
    }

    return [node.cloneNode(true), document.createDocumentFragment()];
  }

  private getNodeTextLength(node: Node): number {
    if (node.nodeType === Node.TEXT_NODE) {
      return (node as Text).textContent?.length || 0;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      return (node as HTMLElement).textContent?.length || 0;
    }
    return 0;
  }

  mergeAdjacentTags(root: HTMLElement | Element): void {
    const processNode = (node: HTMLElement | Element) => {
      const children = Array.from(node.childNodes);
      let i = 0;

      while (i < children.length) {
        const current = children[i];

        if (current.nodeType === Node.ELEMENT_NODE) {
          let j = i + 1;
          let hasOnlyWhitespace = true;

          while (j < children.length) {
            if (children[j].nodeType === Node.ELEMENT_NODE) {
              if (
                (current as Element).tagName ===
                (children[j] as Element).tagName
              ) {
                if (hasOnlyWhitespace) {
                  if (
                    j > i + 1 ||
                    (j === i + 1 && children[i + 1].nodeType === Node.TEXT_NODE)
                  ) {
                    (current as Element).appendChild(
                      document.createTextNode(" ")
                    );
                  }

                  while (children[j].firstChild) {
                    current.appendChild(
                      children[j].firstChild as ChildNode | Node
                    );
                  }

                  for (let k = j; k > i; k--) {
                    node.removeChild(children[k]);
                    children.splice(k, 1);
                  }

                  continue;
                }
              }
              break;
            } else if (children[j].nodeType === Node.TEXT_NODE) {
              if (/\S/.test(children[j].textContent || "")) {
                hasOnlyWhitespace = false;
              }
            }
            j++;
          }
        }
        i++;
      }

      Array.from(node.children).forEach(processNode);
    };

    processNode(root);
  }

  private selection(callback: CallableFunction, select: boolean = false) {
    const { selectionApi } = this.editor,
      range = selectionApi.getRange(),
      selection = selectionApi.getSelection();

    if (!selection && !range) return;

    callback({ range, selection, selectionApi });

    if (select) selectionApi.selectCurrent();
  }

  removeEmptyTags(element: HTMLElement, tagName: string): void {
    const tags = element.getElementsByTagName(tagName);
    const tagsArray = Array.from(tags).reverse();

    tagsArray.forEach((tag) => {
      if (!tag.hasChildNodes() && tag.parentNode) {
        tag.parentNode.removeChild(tag);
      }
    });
  }

  getEdgeChars(str: string): {
    firstChar: string;
    lastChar: string;
    isEmptyFirstChar: boolean;
    isEmptyLastChar: boolean;
  } {
    const firstChar = str[0] || "",
      lastChar = str[str.length - 1] || "";

    return {
      firstChar,
      lastChar,
      isEmptyFirstChar: firstChar.trim() === "",
      isEmptyLastChar: lastChar.trim() === ""
    };
  }
}
