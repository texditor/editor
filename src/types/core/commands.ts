export interface Commands {
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
  ): void;

  /**
   * Applies or removes formatting based on current selection context
   * @param tagName - HTML tag name to format with
   * @param focus - Whether to restore focus after formatting
   */
  format(tagName: string, focus?: boolean): void;

  /**
   * Creates a new format around the current selection
   * @param tagName - HTML tag name to apply
   */
  createFormat(tagName: string): void;

  /**
   * Removes formatting tags from the current selection
   * @param tagName - HTML tag name to remove
   * @param focus - Whether to restore focus after removal
   * @param normalize - Whether to normalize after removal
   */
  removeFormat(tagName: string, focus?: boolean, normalize?: boolean): void;

  /**
   * Removes all formatting tags from the document
   * @param normalize - Whether to normalize after clearing
   */
  clearAllFormatting(normalize?: boolean): void;

  /**
   * Normalizes the DOM structure by removing empty tags and merging adjacent elements
   * @param container - Optional container to normalize (defaults to current selection element)
   */
  normalize(container?: HTMLElement): void;

  /**
   * Flattens nested tags of the same type (e.g., <strong><strong>text</strong></strong>)
   * @param parentElement - Element to process
   */
  flattenNestedSimilarTags(parentElement: HTMLElement): void;

  /**
   * Merges adjacent tags of the same type
   * @param root - Root element to process
   */
  mergeAdjacentTags(root: HTMLElement | Element): void;

  /**
   * Removes empty tags of specified type from an element
   * @param element - Parent element to check
   * @param tagName - Tag name to remove if empty
   */
  removeEmptyTags(element: HTMLElement, tagName: string): void;

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
  ): [HTMLElement, DocumentFragment, HTMLElement];

  /**
   * Replaces empty edges with space characters
   * @param el - Parent element
   * @param item - Optional item to check edges for
   */
  replaceEmptyEdges(el: HTMLElement, item?: HTMLElement | Node): void;

  /**
   * Finds all tags matching the criteria within the current selection
   * @param tagName - Tag name to find (false for all tags)
   * @param childrens - Whether to search in child elements
   * @returns Array of matching HTML elements
   */
  findTags(tagName?: string | boolean, childrens?: boolean): HTMLElement[];

  /**
   * Determines the direction of selection relative to formatting tags
   * @param tagName - Tag name or element to check direction for
   * @returns Direction constant or null
   */
  getSelectionDirection(tagName: string | HTMLElement): string | null;

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
  };
}