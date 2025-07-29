export interface ToolModelInterface {
  onLoad?(): void;
  create?(): HTMLElement;
  applyEvents?(): void;
  name: string;
}
