import type { TexditorInterface } from "@/types";
export interface ToolModelInstanceInterface {
  new (editor: TexditorInterface): ToolModelInterface;
}

export interface ToolModelInterface {
  name: string;
  onLoad?(): void;
  destroy?(): void;
  create?(): HTMLElement;
  applyEvents?(): void;
  getElement(): HTMLElement | null;
  getId(): string;
  format(onlyRemove?: boolean): void;
  forcedFormat(): void;
  removeFormat(): void;
  formatAction(callback: CallableFunction): void;
  getName(): string;
  getTagName(): string;
  isVisible(): boolean;
  onClick(evt: Event): void;
  onAfterFormat(tags: HTMLElement[]): void;
  handleClick(evt: Event): void;
}
