import type { ConfigInterface, ConfigStoreInterface } from "@/types";
export default class Config implements ConfigInterface {
  /** Internal storage for configuration values */
  private store: ConfigStoreInterface;

  constructor(config: ConfigStoreInterface) {
    this.store = {};
    Object.assign(this.store, config);
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
  get<K extends keyof ConfigStoreInterface>(key: K): ConfigStoreInterface[K];

  /**
   * Gets a configuration value with type safety and default
   * @param key - Configuration key to retrieve
   * @param defaultValue - Default value if key doesn't exist
   * @returns Configuration value or default
   */
  get<K extends keyof ConfigStoreInterface>(
    key: K,
    defaultValue: ConfigStoreInterface[K]
  ): ConfigStoreInterface[K];

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
    key: keyof ConfigStoreInterface | string,
    defaultValue: unknown = ""
  ): unknown {
    const value = (this.store as Record<string, unknown>)[key];

    if (value !== undefined) {
      return value;
    }

    return defaultValue !== undefined ? defaultValue : "";
  }
}