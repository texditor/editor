import type { OutputBlockItem } from "..";

export interface APIInterface {
  // Root element management
  setRoot(el: HTMLElement): void;
  getRoot(): HTMLElement | false;
  getUniqueId(): string;

  // Rendering methods
  render(): void;
  destroy(): void;

  // Content methods
  isEmpty(): boolean;
  setContent(content: OutputBlockItem[], index?: number | null): void;
  getContent(): OutputBlockItem[];
  save(): OutputBlockItem[];

  // CSS management
  setCss(object: { [key: string]: string }): void;
  css(key: string, dot?: boolean): string;

  // Display methods
  setDisplay(wrap?: string, visible?: string): void;
}