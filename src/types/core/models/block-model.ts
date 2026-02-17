import type { OutputBlockItem, HTMLBlockElement } from "@/types";
import BlockModel from "@/core/models/block-model";

import type { TexditorInterface } from "@/types";

export interface BlockModelInstanceInterface {
  new (editor: TexditorInterface): BlockModelInterface;
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
  icon: string;
  autoParse: boolean;
  translationCode: string;
  backspaceRemove: boolean;
  cssClasses: string;
  toolbar: boolean;
  tools: unknown[];
  editable: boolean;
  editableChilds: boolean;
  isEnterCreate: boolean;
  rawOutput: boolean;
  sanitizer: boolean;
  sanitizerConfig: Record<string, unknown>;
  tagName: string;
  textArea: boolean;
  type: string;
  relatedTypes: string[];
  emptyDetect: boolean;
  preformatted: boolean;
  customSave: boolean;
  normalize: boolean;
  placeholder?: string;
  [key: string]: unknown;
}

export interface BlockModelInterface {
  create(options?: object | null): HTMLElement | null;
  configure(): Partial<BlockModelConfig>;
  getConfig<K extends keyof BlockModelConfig>(key: K): BlockModelConfig[K];
  getConfig<K extends keyof BlockModelConfig>(
    key: K,
    defaultValue: BlockModelConfig[K]
  ): BlockModelConfig[K];
  getConfig(key: string, defaultValue: unknown): unknown;
  merge(index: number): void;
  getRelatedTypes(): string[];
  parse(item: OutputBlockItem): HTMLBlockElement | HTMLElement | null;
  getType(): string;
  getId(): string;
  getTranslation(): string;
  getIcon(width?: number, height?: number): string;
  getTranslationCode(): string;
  getElement(): HTMLElement | null;
  getTagName(): string;
  afterCreate(newBlock?: HTMLBlockElement | null): void;
  focusChild(): HTMLElement | null;
  onRender(): void;
  __onRenderComplete__(): void;
  save(block: OutputBlockItem, blockElement?: HTMLElement): OutputBlockItem;
  setStore(key: string, value: unknown): this;
  getStore(key: string | null): unknown;
  onPaste?(evt: Event, input: Element | null): void;
  getItemIndex(): number;
  setItemIndex(index: number): void;
  getItem(
    index: HTMLElement | number,
    container?: HTMLElement | null
  ): HTMLElement | number | null;
  moveItem?(item: HTMLElement, index: number): void;
  getItemsLength?(): number;
  isEmptyDetect(): boolean;
  isBackspaceRemove(): boolean;
  isTextArea(): boolean;
  isEditable(): boolean;
  isEditableChilds(): boolean;
  isRawOutput(): boolean;
  isNormalize(): boolean;
  isPreformatted(): boolean;
  isConvertible(): boolean;
  isCustomSave(): boolean;
  isToolbar(): boolean;
  getTolls(): string[];
  editableChild(
    container?: HTMLElement | null,
    isCreate?: boolean
  ): HTMLElement | HTMLElement[] | null;
  convert(
    block: HTMLBlockElement,
    newBlock: HTMLBlockElement
  ): HTMLBlockElement;
  toConvert(
    block: HTMLBlockElement,
    newBlock: HTMLBlockElement
  ): [HTMLBlockElement, HTMLBlockElement];
  sanitize(): void;
  normalizeContainer(): HTMLBlockElement | HTMLElement | HTMLElement[] | null;
  sanitizerContainer(): HTMLBlockElement | HTMLElement | HTMLElement[] | null;
  setup?(config: Partial<BlockModelConfig>): typeof BlockModel;
  destroy?(): void;
}
