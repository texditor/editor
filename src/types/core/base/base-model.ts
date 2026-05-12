import type { EventManager, RenderIconContent, Texditor } from "@/texditor";

/**
 * Generic model constructor interface
 * @template T - Model interface type that extends BaseModel
 * @template C - Model config type that extends BaseModelConfig
 */
export interface ModelConstructor<
  T extends BaseModel = BaseModel,
  C extends BaseModelConfig = BaseModelConfig
> {
  /**
   * Create a new model instance
   * @param editor - Editor instance
   * @returns Model instance of type T
   */
  new(editor: Texditor): T;

  /**
   * Set up global configuration for the model
   * @param config - Configuration object
   * @returns Model constructor
   */
  setup?(config: Partial<C>): ModelConstructor<T, C>;
}

/**
 * DOM node interface
 * Extends HTMLElement with base model reference
 */
export interface BaseElement extends HTMLElement {
  /** Reference to the base model instance */
  baseModel: BaseModel;
}

/**
 * Model configuration interface
 * @property name - Model name identifier
 * @property translation - Translation key for localization
 * @property icon - Icon content for the button
 * @property iconWidth - Icon width in pixels
 * @property iconHeight - Icon height in pixels
 * @property className - CSS class name for styling
 * @property visibleTitle - Whether title is always visible
 * @property __modelCode - Model code identifier for parent models
 */
export interface BaseModelConfig {
  name: string;
  elementTagName: string;
  translation: string;
  icon: RenderIconContent;
  visibleIcon: boolean;
  iconWidth: number;
  iconHeight: number;
  className: string;
  attributeTitle: boolean;
  visibleTitle: boolean;
  __modelCode: string;
  [key: string]: unknown;
}

/**
 * Base model constructor type alias
 */
export type BaseModelConstructor = ModelConstructor<BaseModel, BaseModelConfig>;

/**
 * Base model behavior interface
 * Defines all public methods for model manipulation
 */
export interface BaseModel<TElement extends BaseElement = BaseElement> extends EventManager {
  /**
  * Returns the unique identifier for this event listener instance
  * @returns The unique event ID string used to identify and manage event listeners
  */
  getEventId(): string

  /**
   * Get model name
   * @returns Model name string
   */
  getName(): string;

  /**
   * Get model node tag name
   * @returns Tag name string (default: 'div')
   */
  getElementTagName(): string

  /**
   * Get model ID
   * @returns Unique model identifier string
   */
  getId(): string;

  /**
   * Get model DOM node
   * @returns Model button element
   */
  getElement(): TElement;

  /**
   * Get CSS class name
   * @returns CSS class name string
   */
  getClassName(): string;

  /**
   * Get translation for localization
   * @returns Translated string
   */
  getTranslation(): string;

  /**
   * Get icon content for the model button
   * @returns Icon content
   */
  getIcon(): RenderIconContent;

  /**
   * Get icon width
   * @returns Icon width in pixels
   */
  getIconWidth(): number;

  /**
   * Get icon height
   * @returns Icon height in pixels
   */
  getIconHeight(): number;

  /**
   * Get model code identifier
   * @returns Model code string
   */
  getModelCode(): string;

  /**
   * Check if title is always visible
   * @returns True if title should be always visible
   */
  isVisibleTitle(): boolean;

  /**
   * Checks if the attribute title is configured to be always visible.
   * @returns {boolean} True if the 'attributeTitle' config option is enabled, false otherwise.
   */
  isAttributeTitle(): boolean

  /**
   * Check if icon is always visible
   * @returns True if icon should be always visible
   */
  isVisibleIcon(): boolean;

  /**
   * Check if model is active
   * @returns True if model is active
   */
  isActive(): boolean;

  /**
   * Check if model is visible
   * @returns True if model should be displayed
   */
  isVisible(): boolean;

  /**
   * Destroy instance and clean up resources
   * @returns void
   */
  destroy(): void;

  /**
   * Get configuration value by key
   * @param key - Configuration key
   * @param defaultValue - Default value
   * @returns Configuration value
   */
  getConfig(key: string, defaultValue: boolean): boolean;
  getConfig(key: string, defaultValue: string): string;
  getConfig(key: string, defaultValue: number): number;
  getConfig<K extends keyof BaseModelConfig>(key: K): BaseModelConfig[K];
  getConfig<K extends keyof BaseModelConfig>(
    key: K,
    defaultValue: BaseModelConfig[K]
  ): BaseModelConfig[K];
  getConfig(key: string, defaultValue: unknown): unknown;

  /**
    * Get option value by key
    * @param key - Configuration key
    * @param defaultValue - Default value (optional)
    * @returns Configuration value or null if not found
    */
  getOption<T = unknown>(key: string, defaultValue?: T): T | null;

  /**
   * Set single option value
   * @param key - Configuration key
   * @param value - Value to set
   */
  setOption(key: string, value: unknown): void;

  /**
   * Set multiple options (merges with existing options)
   * @param options - Object with options to merge
   */
  setOptions(options: Record<string, unknown>): void;

  /**
   * Get all options
   * @returns Copy of all options
   */
  getOptions(): Record<string, unknown>;

  /**
   * Remove single option by key
   * @param key - Configuration key to remove
   * @returns True if option existed and was deleted, false otherwise
   */
  removeOption(key: string): boolean;

  /**
   * Clear all options (resets to empty object)
   */
  clearOptions(): void;

  /**
   * Set the value in the store
   * @param key - Storage key
   * @param value - Value to store
   * @returns Current instance for chaining
   */
  setStore(key: string, value: unknown): this;

  /**
   * Get the value in the store
   * @param key - Storage key (null for all)
   * @returns Stored value or null
   */
  getStore(key: string | null): unknown;
}