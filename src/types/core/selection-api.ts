export interface CursorPosition {
  start: number;
  end: number;
}

export interface CurrentSelectionData {
  position: CursorPosition;
  element: HTMLElement | null;
}
