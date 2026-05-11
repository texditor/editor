import type {
  Commands,
  SelectionAPI,
  TexditorInterface
} from "@/types";
import { isEmptyString } from "@/utils/string";
import { closest, mergeAdjacentTextNodes, query } from "@/utils/dom";

/**
 * Commands class handles text formatting operations, selection manipulation,
 * and DOM normalization for the editor. Provides methods for applying and
 * removing HTML tags, managing text ranges, and cleaning up the document structure.
 */
export default class Commands  {
  /** Reference to the main editor instance */
  private editor: TexditorInterface;

  // Direction constants for selection analysis
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

  /**
   * Formats a specific text range within a container with the given HTML tag
   * @param tagName - HTML tag name to apply (e.g., 'strong', 'em')
   * @param startOffset - Starting character offset in the container
   * @param endOffset - Ending character offset in the container
   * @param container - Container element containing the text
   */
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

  /**
   * Applies or removes formatting based on current selection context
   * @param tagName - HTML tag name to format with
   * @param focus - Whether to restore focus after formatting
   */
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

  /**
   * Normalizes the DOM structure by removing empty tags and merging adjacent elements
   * @param container - Optional container to normalize (defaults to current selection element)
   */
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

  /**
   * Creates a new format around the current selection
   * @param tagName - HTML tag name to apply
   */
  createFormat(tagName: string) {
    this.selection(
      ({ selectionApi }: { selectionApi: SelectionAPI }) => {
        const { element, position } = selectionApi.current();
        if (element) {
          this.formatTextRange(tagName, position.start, position.end, element);
        }
      }
    );
  }

  /**
   * Removes formatting tags from the current selection
   * @param tagName - HTML tag name to remove
   * @param focus - Whether to restore focus after removal
   * @param normalize - Whether to normalize after removal
   */
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
        selectionApi: SelectionAPI;
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

  /**
   * Replaces empty edges with space characters
   * @param el - Parent element
   * @param item - Optional item to check edges for
   */
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

  /**
   * Removes all formatting tags from the document
   * @param normalize - Whether to normalize after clearing
   */
  clearAllFormatting(normalize: boolean = true): void {
    this.findTags().forEach((el: HTMLElement) => {
      this.removeFormat(el.localName, true, normalize);
    });
  }

  /**
   * Finds all tags matching the criteria within the current selection
   * @param tagName - Tag name to find (false for all tags)
   * @param childrens - Whether to search in child elements
   * @returns Array of matching HTML elements
   */
  findTags(tagName: string | boolean = false, childrens: boolean = true) {
    const { selectionApi } = this.editor,
      current = selectionApi.current();

    if (!current?.element) return [];

    const selectedTags = selectionApi.findTags(current?.element, childrens);

    if (tagName === false) return selectedTags || [];

    return selectedTags.filter((el: HTMLElement) => el.localName === tagName);
  }

  /**
   * Determines the direction of selection relative to formatting tags
   * @param tagName - Tag name or element to check direction for
   * @returns Direction constant or null
   */
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
      ({ range }: { range: Range; selectionApi: SelectionAPI }) => {
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

  /**
   * Flattens nested tags of the same type (e.g., <strong><strong>text</strong></strong>)
   * @param parentElement - Element to process
   */
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

  /**
   * Splits an element at specified text positions
   * @param element - Element to split
   * @param startIndex - Start index for split
   * @param endIndex - End index for split
   * @returns Tuple of [before element, middle fragment, after element]
   */
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

  /**
   * Splits a node at a specific text position
   * @param node - Node to split
   * @param position - Position to split at
   * @returns Tuple of [before node, after node]
   */
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

  /**
   * Calculates the text length of a node
   * @param node - Node to calculate length for
   * @returns Text length
   */
  private getNodeTextLength(node: Node): number {
    if (node.nodeType === Node.TEXT_NODE) {
      return (node as Text).textContent?.length || 0;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      return (node as HTMLElement).textContent?.length || 0;
    }
    return 0;
  }

  /**
   * Merges adjacent tags of the same type
   * @param root - Root element to process
   */
  mergeAdjacentTags(root: HTMLElement | Element): void {
    const processNode = (node: HTMLElement | Element) => {
      const children = Array.from(node.childNodes);
      let i = 0;

      while (i < children.length - 1) {
        const current = children[i];
        const next = children[i + 1];

        if (current.nodeType === Node.ELEMENT_NODE &&
          next.nodeType === Node.ELEMENT_NODE) {

          const currentEl = current as Element;
          const nextEl = next as Element;

          if (currentEl.tagName === nextEl.tagName) {
            const attrs1 = currentEl.attributes;
            const attrs2 = nextEl.attributes;
            let attributesMatch = attrs1.length === attrs2.length;

            if (attributesMatch) {
              for (let a = 0; a < attrs1.length; a++) {
                const attrName = attrs1[a].name;
                if (currentEl.getAttribute(attrName) !== nextEl.getAttribute(attrName)) {
                  attributesMatch = false;
                  break;
                }
              }
            }

            if (attributesMatch) {
              let hasSignificantTextBetween = false;
              for (let k = i + 1; k < children.indexOf(next); k++) {
                const sibling = children[k];
                if (sibling.nodeType === Node.TEXT_NODE) {
                  if (sibling.textContent && sibling.textContent.trim() !== '') {
                    hasSignificantTextBetween = true;
                    break;
                  }
                } else if (sibling.nodeType === Node.ELEMENT_NODE) {
                  hasSignificantTextBetween = false;
                  break;
                }
              }

              if (hasSignificantTextBetween) {
                currentEl.appendChild(document.createTextNode(' '));
              }

              while (nextEl.firstChild) {
                currentEl.appendChild(nextEl.firstChild);
              }

              node.removeChild(nextEl);
              children.splice(i + 1, 1);
              continue;
            }
          }
        }

        i++;
      }

      for (const child of Array.from(node.children)) {
        processNode(child as HTMLElement | Element);
      }
    };

    processNode(root);
  }
  /**
   * Internal method to handle selection operations
   * @param callback - Function to execute with selection context
   * @param select - Whether to reselect after operation
   */
  private selection(callback: CallableFunction, select: boolean = false) {
    const { selectionApi } = this.editor,
      range = selectionApi.getRange(),
      selection = selectionApi.getSelection();

    if (!selection && !range) return;

    callback({ range, selection, selectionApi });

    if (select) selectionApi.selectCurrent();
  }

  /**
   * Removes empty tags of specified type from an element
   * @param element - Parent element to check
   * @param tagName - Tag name to remove if empty
   */
  removeEmptyTags(element: HTMLElement, tagName: string): void {
    const tags = element.getElementsByTagName(tagName);
    const tagsArray = Array.from(tags).reverse();

    tagsArray.forEach((tag) => {
      if (!tag.hasChildNodes() && tag.parentNode) {
        tag.parentNode.removeChild(tag);
      }
    });
  }

  /**
   * Gets the first and last characters of a string with their emptiness status
   * @param str - Input string
   * @returns Object containing edge characters and their emptiness status
   */
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