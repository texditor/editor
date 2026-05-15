import type {
  SelectionState,
  SelectionAPI as ISelectionAPI,
  Texditor
} from "@/types";
import {
  getChildNodes,
  make,
  html,
  getText,
  getLength,
  makeText,
  append
} from "@/utils";
export default class SelectionAPI implements ISelectionAPI {
  /** Reference to the main editor instance */
  private editor: Texditor;

  /** Currently stored selection data (element and cursor position) */
  private state: SelectionState = {
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
  constructor(editor: Texditor) {
    this.editor = editor;
  }

  /** @see ISelectionAPI.setState */
  setState(
    state: SelectionState
  ): void {
    this.state = state;
  }

  /** @see ISelectionAPI.getState */
  getState(): SelectionState {
    return this.state;
  }

  /** @see ISelectionAPI.clearState */
  clearState(): void {
    this.setState({
      element: null,
      position: {
        start: 0,
        end: 0
      }
    });
  }

  /** @see ISelectionAPI.selectCurrent */
  applyState(): void {
    const { element, position } = this.getState();
    const { start, end } = position;

    if (element)
      this.select(start, end, element);
  }

  /** @see ISelectionAPI.select */
  select(
    startPos: number,
    endPos: number,
    container?: Element,
    scrollToContainer: boolean = false
  ): void {
    const { element } = this.getState();
    const wrapContainer = container || element || null;

    if (!wrapContainer) return;

    const totalLength = getLength(wrapContainer);
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
      const nodeLength = getLength(textNode);

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
        startOffset = getLength(lastNode);
      }
    }

    // Fallback to last node if end not found
    if (!endNode) {
      const lastNode = textNodes[textNodes.length - 1];
      if (lastNode) {
        endNode = lastNode;
        endOffset = getLength(lastNode);
      }
    }

    // Set the range if both nodes are found
    if (startNode && endNode) {
      try {
        range.setStart(
          startNode,
          Math.min(
            startOffset,
            getLength(startNode)
          )
        );

        range.setEnd(
          endNode,
          Math.min(
            endOffset,
            getLength(endNode)
          )
        );
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

  /** @see ISelectionAPI.insert */
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
              ? getText(div)
              : content
          )
        );
      }

      return true;
    }

    return false;
  }

  /** @see ISelectionAPI.insertText */
  insertText(content: string, stripTags = true): boolean {
    return this.insert(content, false, stripTags);
  }

  /** @see ISelectionAPI.splitContent */
  splitContent(container?: HTMLElement | null): string {
    const selection = this.getSelection();

    if (!selection || selection.rangeCount === 0) return "";

    const range = selection.getRangeAt(0);
    const currentParagraph = container
      ? container
      : this.editor.blockManager.getElement();

    if (!currentParagraph) return "";

    const newBlock = make("div");
    html(newBlock, '');

    // Handle split within text node
    if (range.startContainer.nodeType === Node.TEXT_NODE) {
      const textNode = range.startContainer;

      const parent = textNode.parentNode!,
        textContent = getText(textNode);

      const beforeText = textContent.substring(0, range.startOffset),
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
        let newStructure: Node = makeText(afterText);

        parents.forEach((p) => {
          const newParent = p.cloneNode(false);
          append(newParent, newStructure);
          newStructure = newParent;
        });

        append(newBlock, newStructure)

        // Move remaining siblings
        let nextSibling = parent.nextSibling;
        while (nextSibling) {
          append(newBlock, nextSibling.cloneNode(true));
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
          append(newBlock, nextSibling.cloneNode(true));
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

      nodesToMove.forEach((node) => append(newBlock, node));
    }

    return html(newBlock).trim();
  }

  /** @see ISelectionAPI.findTags */
  findTags(
    container: Element | HTMLElement,
    children: boolean = true
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

      if (children) {
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

  /** @see ISelectionAPI.getSelection */
  getSelection(): Selection | null {
    return window.getSelection() || null;
  }

  /** @see ISelectionAPI.getRange */
  getRange(index: number = 0): Range | null {
    const selection: Selection | null = this.getSelection();

    if (!selection) return null;

    if (selection.rangeCount === 0) return null;

    return selection.getRangeAt(index);
  }

  /** @see ISelectionAPI.getAbsoluteOffset */
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

  /** @see ISelectionAPI.getOffset */
  getOffset(container?: Node | HTMLElement | null): [number, number] {
    const range = this.getRange();
    const { element } = this.getState();
    const wrapContainer = container || element || null;

    // Validate range and container
    if (
      !range ||
      !wrapContainer ||
      range.startContainer.ownerDocument !== wrapContainer.ownerDocument
    ) {
      return [-1, -1];
    }

    const containerLength = getLength(wrapContainer),
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

  /** @see ISelectionAPI.getBounds */
  getBounds(): DOMRect | null {
    const range = this.getRange();

    if (!range) return null;

    return range.getBoundingClientRect();
  }

  /** @see ISelectionAPI.getFirstLineBounds */
  getFirstLineBounds(): DOMRect | null {
    const originalRange = this.getRange();

    if (!originalRange) return null;

    // Create temporary range for first line
    const tempRange = document.createRange(),
      start = originalRange.startContainer,
      end = originalRange.startOffset;

    tempRange.setStart(start, end);
    tempRange.setEnd(start, end);

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