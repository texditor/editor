export interface ExtensionModelInterface {
  onLoad?(): void;
  create?(): HTMLElement;
  onClick?(): void;
  name: string;
}
