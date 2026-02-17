export interface CursorPosition {
  start: number;
  end: number;
}

export interface CurrentSelectionData {
  position: CursorPosition;
  element: HTMLElement | null;
}

export interface SelectionAPIInterface {
  // Current selection management
  setCurrent(el: HTMLElement, position: CursorPosition): void;
  current(): CurrentSelectionData;
  cleanCurrent(): void;
  selectCurrent(): void;

  // Node traversal methods
  childNodes(node: Node): Node[];

  // Textarea cursor methods
  getTextareaCursor(input: HTMLTextAreaElement): CursorPosition;

  // Selection methods
  select(
    startPos: number,
    endPos: number,
    container?: Element,
    scrollToContainer?: boolean
  ): void;
  insertText(content: string, cleanHtml?: boolean): boolean;
  splitContent(container?: HTMLElement | null): string;
  findTags(
    container: Element | HTMLElement,
    childrens?: boolean
  ): HTMLElement[];

  // Selection retrieval methods
  getSelection(): Selection | null;
  getRange(index?: number): Range | null;

  // Offset calculation methods
  getAbsoluteOffset(container: Node, offset: number): number;
  getOffset(container?: Node | HTMLElement | null): [number, number];

  // Bounds methods
  getBounds(): DOMRect | null;
  getFirstLineBounds(): DOMRect | null;
}
