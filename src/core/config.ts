import type { ConfigOptions, Config as IConfig } from "@/types";
export default class Config implements IConfig {
  /** Internal storage for configuration values */
  private options: ConfigOptions;

  constructor(config: ConfigOptions) {
    this.options = {};
    Object.assign(this.options, config);
  }

  /**
   * Gets a configuration value with type safety
   * @param key - Configuration key to retrieve
   * @param defaultValue - Default value if key doesn't exist
   * @returns Configuration value or default
   */
  get(key: "defaultBlock", defaultValue: string): string;

  /**
   * Gets a configuration value with type safety
   * @param key - Configuration key to retrieve
   * @returns Configuration value
   */
  get<K extends keyof ConfigOptions>(key: K): ConfigOptions[K];

  /**
   * Gets a configuration value with type safety and default
   * @param key - Configuration key to retrieve
   * @param defaultValue - Default value if key doesn't exist
   * @returns Configuration value or default
   */
  get<K extends keyof ConfigOptions>(
    key: K,
    defaultValue: ConfigOptions[K]
  ): ConfigOptions[K];

  /**
   * Gets a configuration value (fallback for unknown keys)
   * @param key - Configuration key to retrieve
   * @param defaultValue - Default value if key doesn't exist
   * @returns Configuration value or default
   */
  get(key: string, defaultValue: unknown): unknown;

  /**
   * Implementation of the get method
   * @param key - Configuration key to retrieve
   * @param defaultValue - Default value if key doesn't exist
   * @returns Configuration value or default
   */
  get(
    key: keyof ConfigOptions | string,
    defaultValue: unknown = ""
  ): unknown {
    const value = (this.options as Record<string, unknown>)[key];

    if (value !== undefined) {
      return value;
    }

    return defaultValue !== undefined ? defaultValue : "";
  }
}