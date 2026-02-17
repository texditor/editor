import type {
  ActionModelInstanceInterface,
  BlockModelInstanceInterface,
  ExtensionModelInterface,
  ToolModelInstanceInterface
} from "@/types";

export interface ConfigStoreInterface {
  handle?: string;
  onReady?: CallableFunction;
  onChange?: CallableFunction;
  initalData?: object[] | string;
  blockModels?: BlockModelInstanceInterface[];
  tools?: ToolModelInstanceInterface[];
  defaultBlock?: string;
  locale?: string;
  defaultLocale?: string;
  blockParseDataset?: string[];
  actions?: ActionModelInstanceInterface[];
  actionsTopOffset?: number;
  actionsLeftOffset?: number;
  extensions?: ExtensionModelInterface[];
  extensionsLtr?: "left" | "right" | "center";
  extensionsFixed?: boolean;
  extensionsFixedStyle?: false | Record<string, string>;
  extensionVisibleTitle?: boolean;
  autofocus?: boolean;
}

export type ConfigGetFunction = {
  (key: "defaultBlock", defaultValue: string): string;
  <K extends keyof ConfigStoreInterface>(key: K): ConfigStoreInterface[K];
  <K extends keyof ConfigStoreInterface>(key: K, defaultValue: ConfigStoreInterface[K]): ConfigStoreInterface[K];
  (key: string, defaultValue: unknown): unknown;
};

export interface ConfigInterface {
  get: ConfigGetFunction;
}