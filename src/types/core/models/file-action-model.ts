import type {
  TexditorInterface,
  HTMLBlockElement,
  BlockModelInterface
} from "@/types";
export interface FileActionModelInstanceInterface {
  new(
    editor: TexditorInterface,
    item: HTMLElement,
    container: HTMLElement,
    fileBlock: HTMLBlockElement
  ): FileActionModelInterface;
}

export interface FileActionModelInterface {
  onLoad(): void;
  create(): HTMLElement;
  onClick(evt: Event): void;
  onCreate?(el: HTMLElement): HTMLElement;
  getId(): string;
  getName(): string;
  getName(): string;
  getItem(): HTMLElement;
  getItemIndex(): number;
  getElement(): HTMLElement | null;
  getContainer(): HTMLElement;
  getCurrentBlock(): HTMLBlockElement;
  getCurrentBlockModel(): BlockModelInterface;
  isVisible(): boolean;
  refresh(): void;
  menuConfig(): {
    title: string;
    items: [] | HTMLElement[];
    onCreate?: CallableFunction;
  };
  name: string;
}
