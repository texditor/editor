import type {
  ModelConstructor,
  BaseModel,
  BaseModelConfig,
  BaseElement,
  SanitizerConfig,
  TexditorEventBase,
  Toasts,
} from '@/types';

/**
 * Block model constructor type
 * Specialized constructor that creates BlockModel instances with BlockModelConfig
 */
export type BlockModelConstructor = ModelConstructor<BlockModel, BlockModelConfig>;

export interface BlockElement extends BaseElement {
  baseModel: BlockModel;
}

/**
 * Block model schema for registration
 * @property constructor - Constructor reference
 * @property model - Model instance
 */
export interface BlockModelSchema {
  constructor: BlockModelConstructor;
  model: BlockModel;
}

/**
 * Block model configuration interface
 * @property autoMerge - Automatically merge with adjacent blocks
 * @property autoParse - Automatically parse content
 * @property groupCode - Block group categorization
 * @property contentClassName - Name of the CSS class of the content node
 * @property backspaceRemove - Remove block on backspace
 * @property visibleTools - Show tools for block
 * @property availableTools - Available tools list
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
 * @property maxItems - Maximum number of elements
 * @property sortableItems - Enable item sorting
 * @property dragZoneClassName - Name of the drag zone class
 * @property relatedNames - Related block names
 * @property emptyDetect - Enable empty detection
 * @property customSave - Use custom save logic
 * @property normalize - Enable content normalization
 * @property placeholder - Placeholder text
 * @property convertible - Block can be converted
 * @property toastTimeout - Timeout duration in milliseconds
 * @property toastsClassName - The CSS class name for the toasts element
 */
export interface BlockModelConfig extends BaseModelConfig {
  autoMerge: boolean;
  autoParse: boolean;
  groupCode?: string;
  backspaceRemove: boolean;
  visibleTools: boolean;
  availableTools: string[];
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
  itemRelatedNames: string[];
  itemClassName: string;
  itemBodyClassName: string;
  maxItems: number;
  sortableItems: boolean;
  dragZoneClassName: string;
  relatedNames: string[];
  emptyDetect: boolean;
  customSave: boolean;
  normalize: boolean;
  placeholder?: string;
  convertible: boolean;
  contentClassName: string;
  toastTimeout: number;
  toastsClassName: string;
  [key: string]: unknown;
}

/**
 * Block model behavior interface
 * Defines all public methods for block manipulation
 */
export interface BlockModel extends BaseModel<BlockElement> {
  /**
   * Trigger model change event
   * @param name - Event name
   * @param params - Event parameters
   * @param globalParams - Global event parameters
   */
  change(name: string, params?: TexditorEventBase, globalParams?: TexditorEventBase): void;

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
   * Get group code
   * @returns Group code string
   */
  getGroupCode(): string;

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
   * Get maximum allowed items count
   * @returns Maximum items number
   */
  getMaxItems(): number;

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
   * @returns Name of the drag zone class
   */
  getDragZoneClassName(): string;

  /**
   * Get item index
   * @param itemElement - Item element
   * @returns Item index
   */
  getItemIndex(itemElement?: HTMLElement): number;

  /**
   * Show block actions menu
   */
  showActions(): void;

  /**
   * Hide block actions menu
   */
  hideActions(): void;

  /**
   * Create new item
   * @param content - Item content
   * @param index - Insert position
   * @param skipEvents - Skip events
   * @returns True if created
   */
  createItem(content?: string | unknown, index?: number, skipEvents?: boolean): boolean;

  /**
   * Remove item
   * @param index - Item index
   * @returns True if removed
   */
  removeItem(index?: number): boolean;

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

  /** Checks if a new item can be added without exceeding the maximum limit.
   * @returns `true` if allowed, `false` if limit reached
   */
  canCreateItem(): boolean;

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
  isEmptyItem(index: number): boolean;

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
   * Checks if the sanitizer is enabled
   * @returns True if the sanitizer is enabled
   */
  isSanitizer(): boolean;

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
  getSanitizerConfig(): SanitizerConfig;

  /**
   * Gets the CSS class name for the toasts element
   * @returns The CSS class name as a string
   */
  getToastsClassName(): string;

  /**
   * Gets the auto-hide timeout for toast messages in milliseconds
   * @returns Timeout duration in milliseconds
   */
  getToastTimeout(): number;

  /**
   * Gets the Toasts service instance
   * @returns {Toasts} The Toasts service
   */
  toasts(): Toasts;

  /**
   * Set up global configuration
   * @param config - Configuration object
   * @returns BlockModel class
   */
  setup?(config: Partial<BlockModelConfig>): BlockModelConstructor;
}
/** Data of a block: plain text, array of strings, or child blocks. */
export type BlockSchemaData = string | string[] | BlockChildSchema[];

/** HTML attributes as key-value pairs for a block. */
export type BlockSchemaAttr = Record<string, string>;

/** Full block model with type, data, attributes, and metadata. */
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

/** Child block element */
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

/** Simplified model for creating a block – type is provided by context, only data is required. */
export interface BlockCreateSchema extends Omit<BlockSchema, 'type'> {
  data: string | BlockCreateItemSchema[] | unknown[];
}

/** Simplified child item model for creation – only type and string data required. */
export interface BlockCreateItemSchema extends Omit<BlockChildSchema, 'data'> {
  type: string;
  data: string;
}
