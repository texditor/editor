export interface ActionModelInterface {
  onLoad?(): void;
  create?(): HTMLElement;
  applyEvents?(): void;
  name: string;
}
