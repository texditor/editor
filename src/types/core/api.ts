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
  
  // Display methods
  setDisplay(name?: string, visible?: string): void;
}
