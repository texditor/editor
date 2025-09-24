import {
  ActionModelInstanceInterface,
  BlockModelInstanceInterface,
  ExtensionModelInterface,
  ToolModelInstanceInterface
} from "./models";

export interface ConfigStore {
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
