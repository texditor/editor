import type { ConfigOptions, Config as IConfig } from '@/types';
export default class Config implements IConfig {
  /** Internal storage for configuration values */
  private options: ConfigOptions;

  constructor(config: ConfigOptions) {
    this.options = {};
    Object.assign(this.options, config);
  }

  get(key: 'defaultBlock', defaultValue: string): string;
  get<K extends keyof ConfigOptions>(key: K): ConfigOptions[K];
  get<K extends keyof ConfigOptions>(key: K, defaultValue: Required<ConfigOptions>[K]): Required<ConfigOptions>[K];
  get(key: string, defaultValue: unknown): unknown;

  get(key: keyof ConfigOptions | string, defaultValue?: unknown): unknown {
    const value = (this.options as Record<string, unknown>)[key];

    if (value !== undefined) {
      return value;
    }

    return defaultValue;
  }
}
