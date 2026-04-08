import type { RenderIconContent, TexditorInterface } from "@/texditor";

/**
 * Generic model constructor interface
 * @template T - Model interface type that extends BaseModelInterface
 * @template C - Model config type that extends BaseModelConfig
 */
export interface ModelConstructor<
    T extends BaseModelInterface = BaseModelInterface,
    C extends BaseModelConfig = BaseModelConfig
> {
    /**
     * Create a new model instance
     * @param editor - Editor instance
     * @returns Model instance of type T
     */
    new(editor: TexditorInterface): T;

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
export interface BaseNode extends HTMLElement {
    /** Reference to the base model instance */
    baseModel: BaseModelInterface;
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
    /** Model name identifier */
    name: string;
    /** Translation key for localization */
    translation: string;
    /** Icon content for the button */
    icon: RenderIconContent;
    /** Icon width in pixels */
    iconWidth: number;
    /** Icon height in pixels */
    iconHeight: number;
    /** CSS class name for styling */
    className: string;
    /** Whether title is always visible */
    visibleTitle: boolean;
    /** Model code identifier for parent models */
    __modelCode: string;
    /** Additional configuration properties */
    [key: string]: unknown;
}

/**
 * Base model constructor type alias
 */
export type BaseModelConstructor = ModelConstructor<BaseModelInterface, BaseModelConfig>;

/**
 * Base model behavior interface
 * Defines all public methods for model manipulation
 */
export interface BaseModelInterface {
    /**
     * Get model name
     * @returns Model name string
     */
    getName(): string;

    /**
     * Get model ID
     * @returns Unique model identifier string
     */
    getId(): string;

    /**
     * Get model DOM node
     * @returns Model button element
     */
    getNode(): BaseNode;

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