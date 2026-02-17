import type { BlockModelInterface, BlockModelStructure } from ".";

export interface HTMLBlockElement extends HTMLElement {
  blockModel: BlockModelInterface;
  value: string;
}

export interface BlockManagerInterface {
  // Core rendering and element retrieval methods
  render(renderData?: object[] | string): HTMLElement;
  getContainer(): HTMLElement | undefined;
  getItems(): HTMLBlockElement[];
  getByIndex(index: number): HTMLBlockElement | null;
  getNextBlock(): HTMLBlockElement | null;
  getPrevBlock(): HTMLBlockElement | null;
  getCurrentBlock(): HTMLBlockElement | null;
  getTargetBlock(target: EventTarget): HTMLElement | null;
  getElementIndex(
    element: HTMLElement | EventTarget | null,
    findTargetBlock?: boolean
  ): number;

  // Block counting and state checking methods
  count(): number;
  isEmpty(index?: number | null): boolean;
  isTextBlock(block: HTMLBlockElement | null): boolean;

  // Index management methods
  setIndex(index: number): void;
  getIndex(): number;
  getModel(index?: number | null): BlockModelInterface | null;

  // Focus methods
  focus(el?: HTMLElement): void;
  focusByIndex(index: number): HTMLElement | null;

  // Block manipulation methods
  createDefaultBlock(): HTMLElement | null;
  createBlock(
    name: string,
    index?: number | null,
    content?: object
  ): HTMLElement | null;
  removeBlock(index?: number | number[] | null): number | null;
  merge(
    index: number,
    currentIndex?: number | null,
    children?: HTMLElement | null
  ): void;
  convert(block: HTMLBlockElement, model: BlockModelInterface): void;

  // Normalization and detection methods
  detectEmpty(emptyAttr?: boolean): void;
  normalize(): void;

  // Block models methods
  getBlockModels(): BlockModelStructure[];
  getRealType(relatedName: string): string | null;

  // Selection mode methods
  enableSelectionMode(): void;
  disableSelectionMode(): void;
  isSelectionModeActive(): boolean;
  getSelectedBlocks(): HTMLElement[];
  hasSelectedBlocks(): boolean;
  clearSelection(): void;
  deleteSelectedBlocks(): void;

  // Block state management methods
  disableAllBlocks(): void;
  enableAllBlocks(): void;

  // Cleanup method
  destroy(): void;
}
