import type {
  ActionModelConstructor,
  BlockModelConstructor,
  ExtensionModelConstructor,
  LocaleMap,
  ToolModelConstructor
} from "@/types";

/**
 * Configuration store interface defining all available configuration options
 */
export interface ConfigOptions {
  /** Unique identifier for the editor instance */
  handle?: string;

  /** Callback function called when editor is ready */
  onReady?: CallableFunction;

  /** Callback function called when content changes */
  onChange?: CallableFunction;

  /** Initial data to populate the editor */
  initalData?: object[] | string;

  /** Array of block model instances available in the editor */
  blocks?: BlockModelConstructor[];

  /** Array of tool model instances available in the editor */
  tools?: ToolModelConstructor[];

  /** Default block type to insert (e.g., "p", "h1") */
  defaultBlock?: string;

  /** Current locale for translations */
  locale?: string;

  /** Localizations */
  locales?: LocaleMap[];

  /** Default locale fallback */
  defaultLocale?: string;

  /** Array of action model instances */
  actions?: ActionModelConstructor[];

  /** Array of extension model instances */
  extensions?: ExtensionModelConstructor[];

  /** Whether extensions panel is fixed position */
  extensionsFixed?: boolean;

  /** Custom styles for fixed extensions panel */
  extensionsFixedStyle?: false | Record<string, string>;

  /** Whether to show extension titles */
  extensionVisibleTitle?: boolean;

  /** Whether to autofocus editor on initialization */
  autofocus?: boolean;

  /** Autofocus delay */
  autofocusDelay?: number;

  /** Virtual block selection zone */
  selectionZoneElement?: HTMLElement

  /** Use keyboard shortcut history */
  historyShortcuts?: boolean
}

/**
 * Type definition for the config get function with overloads
 */
export type ConfigGetFunction = {
  /**
   * Gets defaultBlock configuration value
   * @param key - Must be "defaultBlock"
   * @param defaultValue - Default string value
   * @returns Configuration value as string
   */
  (key: "defaultBlock", defaultValue: string): string;

  /**
   * Gets a typed configuration value
   * @param key - Configuration key from ConfigOptions
   * @returns Configuration value with proper type
   */
  <K extends keyof ConfigOptions>(key: K): ConfigOptions[K];

  /**
   * Gets a typed configuration value with default
   * @param key - Configuration key from ConfigOptions
   * @param defaultValue - Default value of the same type
   * @returns Configuration value or default
   */
  <K extends keyof ConfigOptions>(
    key: K,
    defaultValue: ConfigOptions[K]
  ): ConfigOptions[K];

  /**
   * Gets any configuration value (fallback)
   * @param key - Any string key
   * @param defaultValue - Default value
   * @returns Configuration value or default as unknown
   */
  (key: string, defaultValue: unknown): unknown;
};

/**
 * Configuration manager interface
 */
export interface Config {
  /** Method to retrieve configuration values */
  get: ConfigGetFunction;
}