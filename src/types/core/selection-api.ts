/**
 * Cursor position interface
 * Represents the start and end offsets of a text selection
 */
export interface CursorPosition {
  /** Starting offset of the selection */
  start: number;
  /** Ending offset of the selection */
  end: number;
}

/**
 * Current selection data interface
 * Stores the active selection state including position and containing element
 */
export interface SelectionState {
  /** Cursor position with start and end offsets */
  position: CursorPosition;
  /** HTML element containing the selection, or null if no selection */
  element: HTMLElement | null;
}

/**
 * Selection API interface
 * Defines the complete API for managing text selection, cursor operations,
 * and range manipulations within the editor
 */
export interface SelectionAPI {
  /**
   * Saves the current selection state.
   * @param state - selection state containing element and cursor position.
   */
  setState(state: SelectionState): void;

  /**
   * Gets the saved selection state.
   * @returns the current selection state.
   */
  getState(): SelectionState;

  /**
   * Clears the saved selection state.
   */
  clearState(): void;

  /**
   * Restores the saved selection state.
   */
  applyState(): void;

  /**
   * Selects text within a container from start to end positions
   * @param startPos - Starting position offset
   * @param endPos - Ending position offset
   * @param container - Container element (optional)
   * @param scrollToContainer - Whether to scroll to the container
   */
  select(startPos: number, endPos: number, container?: Element, scrollToContainer?: boolean): void;

  /**
   * Inserts content at the current cursor position
   * @param content - Content to insert (HTML or text)
   * @param isHtml - Whether content is HTML (true) or plain text (false)
   * @param strip - Whether to strip HTML tags when isHtml is false
   * @returns True if insertion was successful
   */
  insert(content: string, isHtml?: boolean, strip?: boolean): boolean;

  /**
   * Inserts plain text at the current cursor position
   * @param content - Text content to insert
   * @param cleanHtml - Whether to strip HTML tags from content
   * @returns True if insertion was successful
   */
  insertText(content: string, cleanHtml?: boolean): boolean;

  /**
   * Splits content at the current cursor position
   * @param container - Container element to split (optional)
   * @returns HTML string of the content after the split
   */
  splitContent(container?: HTMLElement | null): string;

  /**
   * Finds all HTML tags that intersect with the current selection
   * @param container - Container element to search within
   * @param children - Whether to search children recursively
   * @returns Array of HTML elements that intersect the selection
   */
  findTags(container: Element | HTMLElement, children?: boolean): HTMLElement[];

  /**
   * Gets the current window selection object
   * @returns Selection object or null if not available
   */
  getSelection(): Selection | null;

  /**
   * Gets a specific range from the current selection
   * @param index - Index of the range to retrieve (default: 0)
   * @returns Range object or null if not available
   */
  getRange(index?: number): Range | null;

  /**
   * Calculates absolute character offset within a container
   * @param container - Container node
   * @param offset - Relative offset
   * @returns Absolute offset position
   */
  getAbsoluteOffset(container: Node, offset: number): number;

  /**
   * Gets the start and end offsets of the current selection
   * @param container - Container element (optional)
   * @returns Tuple of [start, end] offsets, or [-1, -1] if invalid
   */
  getOffset(container?: Node | HTMLElement | null): [number, number];

  /**
   * Gets the bounding rectangle of the current selection
   * @returns DOMRect of the selection or null if not available
   */
  getBounds(): DOMRect | null;

  /**
   * Gets the bounding rectangle of the first line of selection
   * @returns DOMRect of the first line or null if not available
   */
  getFirstLineBounds(): DOMRect | null;
}
