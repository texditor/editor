import type { BlockNode, BlockCreateOptions } from "@/types";
import type { TexditorInterface } from "@/types";

/**
 * Block model constructor interface
 */
export interface BlockModelInstanceInterface {
  /**
   * Create new block model instance
   * @param editor - Editor instance
   * @returns Block model instance
   */
  new(editor: TexditorInterface): BlockModelInterface;
}

/**
 * Block model structure for registration
 * @property instance - Constructor reference
 * @property model - Model instance
 * @property type - Block type identifier
 * @property types - Array of supported types
 * @property translation - Localized block name
 * @property icon - Block icon identifier
 */
export interface BlockModelStructure {
  instance: BlockModelInstanceInterface;
  model: BlockModelInterface;
  type: string;
  types: string[];
  translation: string;
  icon: string;
}

/**
 * Block model configuration interface
 * @property autoMerge - Automatically merge with adjacent blocks
 * @property icon - Block icon
 * @property autoParse - Automatically parse content
 * @property translationCode - Localization key
 * @property groupCode - Block group categorization
 * @property backspaceRemove - Remove block on backspace
 * @property cssClasses - Additional CSS classes
 * @property visibleTools - Show tools for block
 * @property tools - Available tools list
 * @property editable - Content is editable
 * @property editableItems - Individual items are editable
 * @property singleItem - Block supports single item only
 * @property enterCreate - Enter key creates new block
 * @property raw - Treat content as raw text
 * @property sanitizer - Enable HTML sanitization
 * @property sanitizerConfig - Sanitizer configuration
 * @property tagName - HTML tag of the block
 * @property type - Unique block type
 * @property itemTagName - HTML tag of the list item
 * @property itemType - Item type
 * @property itemRelatedTypes - Related item types
 * @property itemClassName - Item CSS class
 * @property itemBodyClassName - Item body CSS class
 * @property sortableItems - Enable item sorting
 * @property relatedTypes - Related block types
 * @property emptyDetect - Enable empty detection
 * @property customSave - Use custom save logic
 * @property normalize - Enable content normalization
 * @property placeholder - Placeholder text
 * @property convertible - Block can be converted
 */
export interface BlockModelConfig {
  autoMerge: boolean;
  icon: string;
  autoParse: boolean;
  translationCode: string;
  groupCode?: string;
  backspaceRemove: boolean;
  cssClasses: string;
  visibleTools: boolean;
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

/**
 * Block model behavior interface
 * Defines all public methods for block manipulation
 */
export interface BlockModelInterface {
  /**
   * Get configuration value by key
   * @param key - Configuration key
   * @param defaultValue - Default value
   * @returns Configuration value
   */
  getConfig<K extends keyof BlockModelConfig>(key: K): BlockModelConfig[K];
  getConfig<K extends keyof BlockModelConfig>(
    key: K,
    defaultValue: BlockModelConfig[K]
  ): BlockModelConfig[K];
  getConfig(key: string, defaultValue: unknown): unknown;

  /**
   * Get all the block creation parameters
   * @returns Block creation options
   */
  getOptions(): BlockCreateOptions;

  /**
   * Get the option value
   * @param key - Option key
   * @param defaultValue - Default value
   * @returns Option value
   */
  getOption<K extends keyof BlockCreateOptions>(key: K): BlockCreateOptions[K];
  getOption<K extends keyof BlockCreateOptions>(
    key: K,
    defaultValue: BlockCreateOptions[K]
  ): BlockCreateOptions[K];
  getOption(key: string, defaultValue: unknown): unknown;

  /**
   * Check if Enter creates new block
   * @returns True if Enter creates block
   */
  isEnterCreate(): boolean;

  /**
   * Check if auto-merge enabled
   * @returns True if auto-merge enabled
   */
  isAutoMerge(): boolean;

  /**
   * Check if auto-parse enabled
   * @returns True if auto-parse enabled
   */
  isAutoParse(): boolean;

  /**
   * Get related block types
   * @returns Array of related types
   */
  getRelatedTypes(): string[];

  /**
   * Get block type
   * @returns Block type string
   */
  getType(): string;

  /**
   * Get block ID
   * @returns Block ID
   */
  getId(): string;

  /**
   * Get localized block name
   * @returns Translated block name
   */
  getTranslation(): string;

  /**
   * Get block group code
   * @returns Group code
   */
  getGroupCode(): string;

  /**
   * Get block icon HTML
   * @param width - Icon width
   * @param height - Icon height
   * @returns Icon HTML
   */
  getIcon(width?: number, height?: number): string;

  /**
   * Get translation code
   * @returns Translation key
   */
  getTranslationCode(): string;

  /**
   * Get block DOM node
   * @returns Block node
   */
  getBlockNode(): BlockNode;

  /**
   * Get content DOM node
   * @returns Content node
   */
  getContentNode(): HTMLElement;

  /**
   * Get the name of the block element
   * @returns Tag name
   */
  getTagName(): string;

  /**
   * Store value in block storage
   * @param key - Storage key
   * @param value - Value to store
   * @returns Current instance
   */
  setStore(key: string, value: unknown): this;

  /**
   * Get stored value
   * @param key - Storage key (null for all)
   * @returns Stored value
   */
  getStore(key: string | null): unknown;

  // Items methods

  /**
   * Get item tag name
   * @returns Item tag name
   */
  getItemTagName(): string;

  /**
   * Get item body CSS class
   * @returns Item body class name
   */
  getItemBodyClassName(): string;

  /**
   * Get item CSS class
   * @returns Item class name
   */
  getItemClassName(): string;

  /**
   * Get item type
   * @returns Item type
   */
  getItemType(): string;

  /**
   * Get related item types
   * @returns Related item types array
   */
  getItemRelatedTypes(): string[];

  /**
   * Check if items are sortable
   * @returns True if sortable
   */
  isSortableItems(): boolean;

  /**
   * Get item index
   * @param itemNode - Item element
   * @returns Item index
   */
  getItemIndex(itemNode?: HTMLElement): number;

  /**
   * Create new item
   * @param content - Item content
   * @param index - Insert position
   * @returns True if created
   */
  createItem(content?: string, index?: number): boolean;

  /**
   * Remove item
   * @param index - Item index
   * @returns True if removed
   */
  removeItem(index?: number): boolean

  /**
   * Get item by index
   * @param index - Item index
   * @returns Item element or null
   */
  getItem(index: number): HTMLElement | null;

  /**
   * Get all items
   * @returns Array of items
   */
  getItems(): HTMLElement[];

  /**
   * Get item body by index
   * @param index - Item index
   * @returns Item body or null
   */
  getItemBody(index: number): HTMLElement | null;

  /**
   * Move item to new position
   * @param item - Item to move
   * @param index - Target index
   * @returns void
   */
  moveItem?(item: HTMLElement, index: number): void;

  /**
   * Get number of items
   * @returns Item count
   */
  getItemsLength(): number;

  /**
   * Check if block is empty
   * @returns True if empty
   */
  isEmpty(): boolean;

  /**
   * Check if specific item is empty
   * @param index - Item index
   * @returns True if empty
   */
  isEmptyItem(index: number): boolean

  /**
   * Check if empty detection enabled
   * @returns True if enabled
   */
  isEmptyDetect(): boolean;

  /**
   * Check if backspace removes block
   * @returns True if enabled
   */
  isBackspaceRemove(): boolean;

  /**
   * Check if content is editable
   * @returns True if editable
   */
  isEditable(): boolean;

  /**
   * Check if items are editable
   * @returns True if editable
   */
  isEditableItems(): boolean;

  /**
   * Check if content is raw
   * @returns True if raw
   */
  isRaw(): boolean;

  /**
   * Check if normalization enabled
   * @returns True if enabled
   */
  isNormalize(): boolean;

  /**
   * Check if single item only
   * @returns True if single item
   */
  isSingleItem(): boolean;

  /**
   * Check if convertible
   * @returns True if convertible
   */
  isConvertible(): boolean;

  /**
   * Check if custom save enabled
   * @returns True if custom save
   */
  isCustomSave(): boolean;

  /**
   * Check if tools enabled
   * @returns True if tools enabled
   */
  isVisibleTools(): boolean;

  /**
   * Get available tools
   * @returns Array of tool names
   */
  getAvailableTools(): string[];

  /**
   * Sanitize block content
   * @returns void
   */
  sanitize(): void;

  /**
   * Get content to normalize
   * @returns Content node(s)
   */
  toNormalize(): BlockNode | HTMLElement | HTMLElement[] | null;

  /**
   * Get content to sanitize
   * @returns Content node(s)
   */
  toSanitize(): BlockNode | HTMLElement | HTMLElement[] | null;

  /**
   * Set up global configuration
   * @param config - Configuration object
   * @returns BlockModel class
   */
  setup?(config: Partial<BlockModelConfig>): BlockModelInstanceInterface

  /**
   * Destroy block instance
   * @returns void
   */
  destroy?(): void;


  /**
  * Protected methods for understanding the block model structure
  * 
  * Create
  * protected create(options?: BlockCreateOptions): HTMLElement;
  * protected makeItemNode(content?: string | unknown): HTMLElement;
  * 
  * Parse
  * protected parse(item: BlockOutput): BlockNode | HTMLElement | null;
  * 
  * Merge
  * protected merge(): HTMLElement | null;
  * 
  * Save
  * protected save(block: BlockOutput, blockNode?: BlockNode): BlockOutput;
  * 
  * Events
  * protected onPaste(evt: Event, map: PasteMap): boolean;
  * protected onKeyDown(evt: KeyboardEvent): boolean;
  * protected onKeyUp(evt: KeyboardEvent): boolean;
  * protected onFocus(evt: FocusEvent): boolean;
  * protected onBlur(evt: FocusEvent): boolean
  * protected onClick(evt: MouseEvent): boolean;
  * protected onSelectionChange(evt: Event, range: Range): boolean;
  * protected onDragStart(evt: DragEvent): boolean;
  * protected onDragLeave(evt: DragEvent): boolean;
  * protected onDragOver(evt: DragEvent): boolean;
  * protected onDrag(evt: DragEvent): boolean;
  * protected onDragEnd(evt: DragEvent): boolean;
  * protected onDrop(evt: DragEvent): boolean;
  * protected onCreate(): void
  * protected onRender(): void;
  * protected afterCreate(): void;
  * 
  * Convert
  * protected beforeConvert(blockNode: BlockNode, targetModel: BlockModelInterface): [BlockNode, BlockModelInterface];
  * protected afterConvert(newBlockNode: BlockNode): BlockNode;
  */
}