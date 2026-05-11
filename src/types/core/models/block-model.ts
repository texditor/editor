import type {
  ModelConstructor,
  BaseModelInterface,
  BaseModelConfig,
  BaseElement,
  SanitizerConfig
} from "@/types";

/**
 * Block model constructor type
 * Specialized constructor that creates ActionModelInterface instances
 * with ActionModelConfig
 */
export type BlockModelConstructor = ModelConstructor<BlockModelInterface, BlockModelConfig>;

export interface BlockElement extends BaseElement {
  baseModel: BlockModelInterface;
}

/**
 * Block model schema for registration
 * @property constructor - Constructor reference
 * @property model - Model instance
 */
export interface BlockModelSchema {
  constructor: BlockModelConstructor;
  model: BlockModelInterface;
}

/**
 * Block model configuration interface
 * @property autoMerge - Automatically merge with adjacent blocks
 * @property icon - Block icon
 * @property autoParse - Automatically parse content
 * @property groupCode - Block group categorization
 * @property contentClassName - Name of the CSS class of the content node
 * @property backspaceRemove - Remove block on backspace
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
 * @property itemTagName - HTML tag of the list item
 * @property itemName - Item type
 * @property itemRelatedNames - Related item names
 * @property itemClassName - Item CSS class
 * @property itemBodyClassName - Item body CSS class
 * @property sortableItems - Enable item sorting
 * @property dragZoneClassName - Name of the drag zone class
 * @property relatedNames - Related block names
 * @property emptyDetect - Enable empty detection
 * @property customSave - Use custom save logic
 * @property normalize - Enable content normalization
 * @property placeholder - Placeholder text
 * @property convertible - Block can be converted
 */
export interface BlockModelConfig extends BaseModelConfig {
  autoMerge: boolean;
  autoParse: boolean;
  groupCode?: string;
  backspaceRemove: boolean;
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
  itemTagName: string;
  itemName: string;
  itemRelatedNames: string[],
  itemClassName: string,
  itemBodyClassName: string,
  sortableItems: boolean;
  dragZoneClassName: string;
  relatedNames: string[];
  emptyDetect: boolean;
  customSave: boolean;
  normalize: boolean;
  placeholder?: string;
  convertible: boolean;
  contentClassName: string;
  [key: string]: unknown;
}

/**
 * Block model behavior interface
 * Defines all public methods for block manipulation
 */
export interface BlockModelInterface extends BaseModelInterface<BlockElement> {
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
   * Get related block names
   * @returns Array of related names
   */
  getRelatedNames(): string[];

  /**
   * Gets an array of all supported type names
   * @returns Array of supported type names (includes main type and related types)
   */
  getSupportedNames(): string[];

  /**
   * Gets the block placeholder text
   * @returns Placeholder text (empty string if not set)
   */
  getPlaceholder(): string;

  /**
   * Gets the CSS class name for the content element
   * @returns The CSS class name as a string
   */
  getContentClassName(): string;

  /**
   * Gets content node CSS class name
   * @returns CSS class name
   */
  getContentClassName(): string;

  /**
   * Get content DOM node
   * @returns Content node
   */
  getContentElement(): HTMLElement;

  /**
   * Get the name of the block element
   * @returns Tag name
   */
  getTagName(): string;

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
  getItemName(): string;

  /**
   * Get related item names
   * @returns Related item names array
   */
  getItemRelatedNames(): string[];

  /**
   * Gets an array of all supported item type names
   * @returns Array of supported type names (includes main item type and related types)
   */
  getItemSupportedNames(): string[];

  /**
   * Check if items are sortable
   * @returns True if sortable
   */
  isSortableItems(): boolean;

  /**
 * Get the name of the drag zone class
 * @returns {string} Name of the drag zone class
 */
  getDragZoneClassName(): string

  /**
   * Get item index
   * @param itemNode - Item element
   * @returns Item index
   */
  getItemIndex(itemNode?: HTMLElement): number;

  /** Show actions */
  showActions(): void;
  
  /** Hide actions */
  hideActions(): void;

  /**
   * Create new item
   * @param content - Item content
   * @param index - Insert position
   * @param skipEvents - Skip events
   * @returns True if created
   */
  createItem(content?: string, index?: number, skipEvents?: boolean): boolean;

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
   * @param index - Item index
   * @param targetIndex - Target item index 
   * @param skipEvents - Skip events
   */
  moveItem(index: number, targetIndex: number, skipEvents?: boolean): void;

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
   */
  sanitize(): void;

  /**
   * Get content to normalize
   * @returns Content node(s)
   */
  toNormalize(): BlockElement | HTMLElement | HTMLElement[] | null;

  /**
   * Get content to sanitize
   * @returns Content node(s)
   */
  toSanitize(): BlockElement | HTMLElement | HTMLElement[] | null;

  /**
   * Gets the sanitizer configuration for block content
   * @returns Sanitizer configuration object, or empty object if not set
   */
  getSanitizerConfig(): SanitizerConfig

  /**
   * Set up global configuration
   * @param config - Configuration object
   * @returns BlockModel class
   */
  setup?(config: Partial<BlockModelConfig>): BlockModelConstructor

  /**
  * Protected methods for understanding the block model structure
  * 
  * Create
  * protected makeItemNode(content?: string | unknown): HTMLElement;
  * protected compose(createSchema?: BlockCreateSchema): BlockElement;
  * 
  * Parse
  * protected parse(_item: BlockCreateSchema): BlockCreateSchema
  * 
  * Merge
  * protected merge(): HTMLElement | null;
  * 
  * Save
  * protected save(block: BlockSchema, blockElement?: BlockElement): BlockSchema;
  * 
  * Events
  * protected onCompose(createSchema?: BlockCreateSchema): void
  * protected onPaste(evt: Event, map: PasteMap): boolean;
  * protected onKeyDown(evt: KeyboardEvent): boolean;
  * protected onKeyUp(evt: KeyboardEvent): boolean;
  * protected onFocus(evt: FocusEvent): boolean;
  * protected onBlur(evt: FocusEvent): boolean
  * protected onSelectionChange(evt: Event, range: Range): boolean;
  * protected onDragStart(evt: DragEvent): boolean;
  * protected onDragLeave(evt: DragEvent): boolean;
  * protected onDragOver(evt: DragEvent): boolean;
  * protected onDrag(evt: DragEvent): boolean;
  * protected onDragEnd(evt: DragEvent): boolean;
  * protected onDrop(evt: DragEvent): boolean;
  * 
  * Convert
  * protected beforeConvert(blockElement: BlockElement, targetModel: BlockModelInterface): [BlockElement, BlockModelInterface];
  * protected afterConvert(newBlockElement: BlockElement): BlockElement;
  */
}

export type BlockSchemaData = string | string[] | BlockChildSchema[];
export type BlockSchemaAttr = Record<string, string>;


export interface BlockSchema {
  type: string;
  data: BlockSchemaData;
  attr?: BlockSchemaAttr;
  lang?: string;
  caption?: string;
  layout?: string;
  style?: string;
  [key: string]: unknown;
}

export interface BlockChildSchema {
  type: string;
  data: BlockSchemaData | [];
  attr?: BlockSchemaAttr;
  url?: string;
  desc?: string;
  caption?: string;
  size?: number;
  [key: string]: unknown;
}

// Create
export interface BlockCreateSchema extends Omit<BlockSchema, "type"> {
  data: string | BlockCreateItemSchema[] | unknown[]
}

export interface BlockCreateItemSchema extends Omit<BlockChildSchema, 'data'> {
  type: string;
  data: string,
}