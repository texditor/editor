import type {
  TexditorInterface,
  BlockNode,
  BlockModelInterface
} from "@/types";
export interface FileActionModelInstanceInterface {
  new (
    editor: TexditorInterface,
    item: HTMLElement,
    container: HTMLElement,
    fileBlock: BlockNode
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
  getNode(): HTMLElement | null;
  getContainer(): HTMLElement;
  getBlockNode(): BlockNode;
  getBlockModel(): BlockModelInterface;
  isVisible(): boolean;
  refresh(): void;
  menuConfig(): {
    title: string;
    items: [] | HTMLElement[];
    onCreate?: CallableFunction;
  };
  name: string;
}
