import type { BlockOutput, BlockNode, BlockCreateOptions } from "@/types";
import BlockModel from "@/core/models/block-model";

import type { TexditorInterface } from "@/types";

export interface BlockModelInstanceInterface {
  new(editor: TexditorInterface): BlockModelInterface;
}

export interface BlockModelStructure {
  instance: BlockModelInstanceInterface;
  model: BlockModelInterface;
  type: string;
  types: string[];
  translation: string;
  icon: string;
}

export interface BlockModelStructure {
  instance: BlockModelInstanceInterface;
  model: BlockModelInterface;
  type: string;
  types: string[];
  translation: string;
  icon: string;
}

export interface BlockModelConfig {
  autoMerge: boolean;
  autoPaste: boolean;
  icon: string;
  autoParse: boolean;
  translationCode: string;
  groupCode?: string;
  backspaceRemove: boolean;
  cssClasses: string;
  toolbar: boolean;
  tools: unknown[];
  editable: boolean;
  editableItems: boolean;
  singleItem: boolean;
  enterCreate: boolean;
  raw: boolean;
  sanitizer: boolean;
  sanitizerConfig: Record<string, unknown>;
  tagName: string;
  type: string;
  itemTagName: string;
  itemType: string;
  itemRelatedTypes: string[],
  itemClassName: string,
  itemBodyClassName: string,
  sortableItems: boolean;
  relatedTypes: string[];
  emptyDetect: boolean;
  customSave: boolean;
  normalize: boolean;
  placeholder?: string;
  convertible: boolean;
  [key: string]: unknown;
}

export interface BlockModelInterface {
  create(options?: BlockCreateOptions): HTMLElement;
  configure(): Partial<BlockModelConfig>;
  getConfig<K extends keyof BlockModelConfig>(key: K): BlockModelConfig[K];
  getConfig<K extends keyof BlockModelConfig>(
    key: K,
    defaultValue: BlockModelConfig[K]
  ): BlockModelConfig[K];
  getConfig(key: string, defaultValue: unknown): unknown;
  isEnterCreate(): boolean;
  isAutoMerge(): boolean;
  isAutoParse(): boolean;
  isAutoPaste(): boolean;
  merge(): HTMLElement | null;
  getRelatedTypes(): string[];
  parse(item: BlockOutput): BlockNode | HTMLElement | null;
  getType(): string;
  getId(): string;
  getTranslation(): string;
  getGroupCode(): string;
  getIcon(width?: number, height?: number): string;
  getTranslationCode(): string;
  getBlockNode(): BlockNode | null;
  getContentNode(): HTMLElement | null;
  getTagName(): string;
  afterCreate(newBlock: BlockNode): void;
  onRender(): void;
  save(block: BlockOutput, blockNode?: BlockNode): BlockOutput;
  setStore(key: string, value: unknown): this;
  getStore(key: string | null): unknown;
  onPaste(evt: Event, nodes: Node[], blockNodes: Node[]): void;
  // Items
  getItemTagName(): string;
  getItemBodyClassName(): string;
  getItemClassName(): string;
  getItemType(): string;
  getItemRelatedTypes(): string[];
  isSortableItems(): boolean;
  getItemIndex(itemNode?: HTMLElement): number;
  makeItemNode(content?: string): HTMLElement;
  createItem(content?: string, index?: number): boolean;
  removeItem(index?: number): boolean
  getItem(index: number): HTMLElement | null;
  getItems(): HTMLElement[];
  getItemBody(index: number): HTMLElement | null;
  moveItem?(item: HTMLElement, index: number): void;
  getItemsLength(): number;

  /**
 * Checks if a block is empty
 * @returns True if block is empty
 */
  isEmpty(): boolean;
  isEmptyItem(index: number): boolean
  isEmptyDetect(): boolean;
  isBackspaceRemove(): boolean;
  isEditable(): boolean;
  isEditableItems(): boolean;
  isRaw(): boolean;
  isNormalize(): boolean;
  isSingleItem(): boolean;
  isConvertible(): boolean;
  isCustomSave(): boolean;
  isToolbar(): boolean;
  getTolls(): string[];
  beforeConvert(
    blockNode: BlockNode,
    targetModel: BlockModelInterface
  ): [BlockNode, BlockModelInterface];
  afterConvert(newBlockNode: BlockNode): BlockNode;
  sanitize(): void;
  normalizeContainer(): BlockNode | HTMLElement | HTMLElement[] | null;
  sanitizerContainer(): BlockNode | HTMLElement | HTMLElement[] | null;
  setup?(config: Partial<BlockModelConfig>): typeof BlockModel;
  destroy?(): void;
}
