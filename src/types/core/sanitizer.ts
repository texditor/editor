export interface SanitizerConfig {
  elements?: string[];
  attributes?: Record<string, string[]>;
  allowComments?: boolean;
  protocols?: Record<string, Record<string, string[]>>;
  addAttributes?: Record<string, Record<string, string>>;
  dom?: Document;
  removeContents?: string[] | boolean;
  transformers?: Array<
    (context: TransformerContext) => TransformerOutput | null
  >;
  removeAllContents?: boolean;
  removeElementContents?: object;
}

export interface TransformerContext {
  allowedElements: Record<string, boolean>;
  config: SanitizerConfig;
  node: Node;
  nodeName: string;
  whitelistNodes: Node[];
  dom: Document;
}

export interface TransformerOutput {
  whitelist?: boolean;
  attrWhitelist?: string[];
  node?: Node;
  whitelistNodes?: Node[];
}
