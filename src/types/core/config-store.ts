export interface ConfigStore {
  handle?: string;
  onReady?: CallableFunction;
  onChange?: CallableFunction;
  initalData?: object[] | string;
  blockModels?: object[];
  toolModels?: object[];
  defaultBlock?: string;
  locale?: string;
  defaultLocale?: string;
  blockParseDataset?: string[];
  actionsTopOffset?: number;
  actionsLeftIndent?: number;
}
