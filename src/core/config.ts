import type { ConfigStoreInterface } from "@/types";

export default class Config {
  private store: ConfigStoreInterface;

  constructor(config: ConfigStoreInterface) {
    this.store = {};
    this.store.blockParseDataset = ["type", "data"];
    Object.assign(this.store, config);
  }

  get(key: "defaultBlock", defaultValue: string): string;
  get<K extends keyof ConfigStoreInterface>(key: K): ConfigStoreInterface[K];
  get<K extends keyof ConfigStoreInterface>(key: K, defaultValue: ConfigStoreInterface[K]): ConfigStoreInterface[K];
  get(key: string, defaultValue: unknown): unknown;
  get(key: keyof ConfigStoreInterface | string, defaultValue: unknown = ""): unknown {
    const value = (this.store as Record<string, unknown>)[key];

    if (value !== undefined) {
      return value;
    }

    return defaultValue !== undefined ? defaultValue : "";
  }
}
