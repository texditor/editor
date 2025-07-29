export interface BlockModelConfig {
  autoMerge: boolean;
  icon: string;
  autoParse: boolean;
  translationCode: string;
  backspaceRemove: boolean;
  cssClasses: string;
  toolbar: boolean;
  tools: unknown[];
  editable: boolean;
  editableChilds: boolean;
  isEnterCreate: boolean;
  rawOutput: boolean;
  sanitizer: boolean;
  sanitizerConfig: Record<string, unknown>;
  tagName: string;
  textArea: boolean;
  type: string;
  relatedTypes: string[];
  emptyDetect: boolean;
  pasteAlwaysText: boolean;
  customSave: boolean;
  normalize: boolean;
  placeholder?: string;
  [key: string]: unknown;
}
