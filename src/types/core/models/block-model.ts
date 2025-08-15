import { OutputBlockItem } from "@/types/output";
import { HTMLBlockElement } from "../html-block-element";
export interface BlockModelInterface {
  create(options?: object | null): HTMLElement | null;
  configure(): object;
  getConfig(key: string | null): unknown;
  merge?(index: number): void;
  getRelatedTypes(): string[];
  parse?(item: OutputBlockItem): HTMLBlockElement | HTMLElement | null;
  getType(): string;
  getId(): string;
  getTranslation(): string;
  getIcon(width?: number, height?: number): string;
  getTranslationCode(): string;
  getElement(): HTMLElement | null;
  afterCreate?(newBlock?: HTMLBlockElement | null): void;
  focusChild?(): HTMLElement | null;
  setStore(key: string, value: unknown): this;
  getStore(key: string | null): unknown;
}
