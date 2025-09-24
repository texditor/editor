export interface ActionModelInterface {
  onLoad(): void;
  create(): HTMLElement;
  applyEvents?(): void;
  onClick(evt: Event): void;
  getId(): string;
  getElement(): HTMLElement | null;
  getName(): string;
  isVisible(): boolean;
  menuConfig(): {
    title: string;
    items: [] | HTMLElement[];
    onCreate?: CallableFunction;
  };
  name: string;
}
