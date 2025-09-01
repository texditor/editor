export interface ExtensionModelInterface {
  onLoad?(): void;
  create?(): HTMLElement;
  onClick?(): void;
  getName?(): string;
  getId?(): string;
  getElement?(): HTMLElement | null;
  getGroupName?(): string;
  name: string;
}
