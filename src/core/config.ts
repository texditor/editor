import { ConfigStore } from "@/types/core";

export default class Config {
  private store: ConfigStore;

  constructor(config: ConfigStore) {
    this.store = {};
    this.store.blockParseDataset = ["type", "data"];
    Object.assign(this.store, config);
  }

  get(key: "defaultBlock", defaultValue: string): string;
  get<K extends keyof ConfigStore>(key: K): ConfigStore[K];
  get<K extends keyof ConfigStore>(key: K, defaultValue: ConfigStore[K]): ConfigStore[K];
  get(key: string, defaultValue: unknown): unknown;
  get(key: keyof ConfigStore | string, defaultValue: unknown = ""): unknown {
    const value = (this.store as Record<string, unknown>)[key];

    if (value !== undefined) {
      return value;
    }

    return defaultValue !== undefined ? defaultValue : "";
  }
}
