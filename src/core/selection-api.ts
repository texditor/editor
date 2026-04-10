import type {
  CurrentSelectionData,
  CursorPosition,
  SelectionAPIInterface,
  TexditorInterface
} from "@/types";
import { getChildNodes, make, html } from "@/utils";
export default class SelectionAPI implements SelectionAPIInterface {
  /** Reference to the main editor instance */
  private editor: TexditorInterface;

  /** Currently stored selection data (element and cursor position) */
  private currentData: CurrentSelectionData = {
    position: {
      start: 0,
      end: 0
    },
    element: null
  };

  /**
   * Creates a new SelectionAPI instance
   * @param editor - Reference to the main Texditor instance
   */
  constructor(editor: TexditorInterface) {
    this.editor = editor;
  }

  /**
   * Sets the current selection data
   * @param el - HTML element containing the selection
   * @param position - Cursor position with start and end offsets
   */
  setCurrent(el: HTMLElement, position: CursorPosition): void {
    this.currentData = {
      element: el,
      position: position
    };
  }

  /**
   * Gets the current selection data
   * @returns Current selection data containing element and position
   */
  current(): CurrentSelectionData {
    return this.currentData;
  }

  /**
   * Clears the current selection data
   * Resets position to (0,0) and element to null
   */
  cleanCurrent(): void {
    this.currentData = {
      position: {
        start: 0,
        end: 0
      },
      element: null
    };
  }

  /**
   * Applies the stored current selection to the DOM
   * Restores the saved cursor position and selection range
   */
  selectCurrent() {
    const { element, position } = this.current(),
      { start, end } = position;

    if (element) this.select(start, end, element);
  }

  /**
   * Selects text within a container from start to end positions
   * @param startPos - Starting position offset
   * @param endPos - Ending position offset
   * @param container - Container element (uses current element if not provided)
   * @param scrollToContainer - Whether to scroll to the container
   */
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

    // Create tree walker to find all text nodes
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

    // Collect all text nodes
    while ((node = walker.nextNode() as Text | null)) {
      textNodes.push(node);
    }

    // Find start and end nodes based on positions
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

    // Fallback to last node if start not found
    if (!startNode) {
      const lastNode = textNodes[textNodes.length - 1];
      if (lastNode) {
        startNode = lastNode;
        startOffset = lastNode.textContent?.length || 0;
      }
    }

    // Fallback to last node if end not found
    if (!endNode) {
      const lastNode = textNodes[textNodes.length - 1];
      if (lastNode) {
        endNode = lastNode;
        endOffset = lastNode.textContent?.length || 0;
      }
    }

    // Set the range if both nodes are found
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

    // Scroll to container if requested
    if (container && scrollToContainer) {
      container.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    selection.removeAllRanges();
    selection.addRange(range);
  }

  /**
   * Inserts content at the current cursor position
   * @param content - Content to insert (HTML or text)
   * @param isHtml - Whether content is HTML (true) or plain text (false)
   * @param strip - Whether to strip HTML tags when isHtml is false
   * @returns True if insertion was successful
   */
  insert(
    content: string,
    isHtml = true,
    strip = true
  ): boolean {
    const selection = this.getSelection(),
      activeElement = document.activeElement as HTMLElement;

    if (
      activeElement?.isContentEditable &&
      selection &&
      selection.rangeCount > 0
    ) {
      const range = this.getRange();
      if (!range) return false;

      // Delete current selection content
      range.deleteContents();
      const div = make("div", (div: HTMLDivElement) => {
        html(div, content);
      });

      if (isHtml) {
        // Insert HTML nodes in reverse order to maintain proper sequence
        getChildNodes(div).reverse().forEach((node) => {
          range.insertNode(node)
        })
      } else {
        // Insert as plain text
        range.insertNode(
          document.createTextNode(
            strip
              ? div.textContent || ""
              : content
          )
        );
      }

      return true;
    }

    return false;
  }

  /**
   * Inserts plain text at the current cursor position
   * @param content - Text content to insert
   * @param stripTags - Whether to strip HTML tags from content
   * @returns True if insertion was successful
   */
  insertText(content: string, stripTags = true): boolean {
    return this.insert(content, false, stripTags);
  }

  /**
   * Splits content at the current cursor position
   * Creates new block with content after the cursor
   * @param container - Container element to split (optional)
   * @returns HTML string of the content after the split
   */
  splitContent(container?: HTMLElement | null): string {
    const selection = this.getSelection();

    if (!selection || selection.rangeCount === 0) return "";

    const range = selection.getRangeAt(0);
    const currentParagraph = container
      ? container
      : this.editor.blockManager.getNode();

    if (!currentParagraph) return "";

    const newBlock = document.createElement("div");
    newBlock.innerHTML = "";

    // Handle split within text node
    if (range.startContainer.nodeType === Node.TEXT_NODE) {
      const textNode = range.startContainer,
        parent = textNode.parentNode!,
        textContent = textNode.textContent || "",
        beforeText = textContent.substring(0, range.startOffset),
        afterText = textContent.substring(range.startOffset);

      // Update original text node with text before cursor
      textNode.textContent = beforeText;

      // Handle nested structure if needed
      if (parent !== currentParagraph) {
        let currentNode: Node = textNode;
        const parents: Node[] = [];

        // Collect parent chain
        while (
          currentNode &&
          currentNode !== currentParagraph &&
          currentNode.parentNode !== currentParagraph
        ) {
          parents.push(currentNode.parentNode!);
          currentNode = currentNode.parentNode!;
        }

        // Build new structure for after-text
        let newStructure: Node = document.createTextNode(afterText);

        parents.forEach((p) => {
          const newParent = p.cloneNode(false);
          newParent.appendChild(newStructure);
          newStructure = newParent;
        });

        newBlock.appendChild(newStructure);

        // Move remaining siblings
        let nextSibling = parent.nextSibling;
        while (nextSibling) {
          newBlock.appendChild(nextSibling.cloneNode(true));
          parent.parentNode?.removeChild(nextSibling);
          nextSibling = parent.nextSibling;
        }
      } else {
        // Simple case - direct child of paragraph
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
      // Handle split at element boundary
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

  /**
   * Finds all HTML tags that intersect with the current selection
   * @param container - Container element to search within
   * @param childrens - Whether to search children recursively
   * @returns Array of HTML elements that intersect the selection
   */
  findTags(
    container: Element | HTMLElement,
    childrens: boolean = true
  ): HTMLElement[] {
    const selection = this.getSelection();

    if (!selection || selection.rangeCount === 0) return [];

    const range = selection.getRangeAt(0);
    const selectedTags: HTMLElement[] = [];

    // Check if selection is within container
    if (!container.contains(range.commonAncestorContainer)) {
      return [];
    }

    /**
     * Recursively checks if an element intersects with selection
     * @param element - Element to check
     */
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

  /**
   * Gets the current window selection object
   * @returns Selection object or null if not available
   */
  getSelection(): Selection | null {
    return window.getSelection() || null;
  }

  /**
   * Gets a specific range from the current selection
   * @param index - Index of the range to retrieve (default: 0)
   * @returns Range object or null if not available
   */
  getRange(index: number = 0): Range | null {
    const selection: Selection | null = this.getSelection();

    if (!selection) return null;

    if (selection.rangeCount === 0) return null;

    return selection.getRangeAt(index);
  }

  /**
   * Calculates absolute character offset within a container
   * @param container - Container node
   * @param offset - Relative offset
   * @returns Absolute offset position
   */
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

  /**
   * Recursively searches through nodes to find text nodes
   * @param container - Root container node
   * @param startNode - Starting node for search
   * @param predicate - Predicate function to test nodes
   * @param excludeSibling - Whether to exclude sibling traversal
   * @returns True if predicate found a match
   */
  private searchNode(
    container: Node,
    startNode: Node,
    predicate: (node: Node) => boolean,
    excludeSibling?: boolean
  ): boolean {
    if (predicate(startNode as Text)) {
      return true;
    }

    // Search through children
    for (let i = 0, len = startNode.childNodes.length; i < len; i++) {
      if (
        this.searchNode(startNode, startNode.childNodes[i], predicate, true)
      ) {
        return true;
      }
    }

    // Search through siblings if not excluded
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

  /**
   * Gets the start and end offsets of the current selection
   * @param container - Container element (uses current element if not provided)
   * @returns Tuple of [start, end] offsets, or [-1, -1] if invalid
   */
  getOffset(container?: Node | HTMLElement | null): [number, number] {
    const range = this.getRange();
    const { element } = this.current();
    const wrapContainer = container || element || null;

    // Validate range and container
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

    // Check if selection is completely inside container
    if (
      range.compareBoundaryPoints(Range.START_TO_START, containerRange) >= 0 &&
      range.compareBoundaryPoints(Range.END_TO_END, containerRange) <= 0
    ) {
      // Handle full container selection
      if (
        range.startContainer === wrapContainer &&
        range.startOffset === 0 &&
        range.endContainer === wrapContainer &&
        range.endOffset === containerLength
      ) {
        return [0, containerLength];
      }

      // Calculate offsets for partial selection
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

    // Handle selection that extends beyond container
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
      // Selection inside container - calculate end
      const endRange = document.createRange();
      endRange.setStart(wrapContainer, 0);
      endRange.setEnd(range.endContainer, range.endOffset);
      end = endRange.toString().length;
    }

    return [start, end];
  }

  /**
   * Gets the bounding rectangle of the current selection
   * @returns DOMRect of the selection or null if not available
   */
  getBounds(): DOMRect | null {
    const range = this.getRange();

    if (!range) return null;

    return range.getBoundingClientRect();
  }

  /**
   * Gets the bounding rectangle of the first line of selection
   * Useful for positioning popups and toolbars
   * @returns DOMRect of the first line or null if not available
   */
  getFirstLineBounds(): DOMRect | null {
    const originalRange = this.getRange();

    if (!originalRange) return null;

    // Create temporary range for first line
    const tempRange = document.createRange();
    tempRange.setStart(originalRange.startContainer, originalRange.startOffset);
    tempRange.setEnd(originalRange.startContainer, originalRange.startOffset);

    const rect = tempRange.getBoundingClientRect();

    // If collapsed range has no dimensions, try getting client rects
    if (rect.width === 0 || rect.height === 0) {
      const clientRects = originalRange.getClientRects();

      if (clientRects.length > 0) {
        return clientRects[0];
      }
    }

    return rect;
  }
}