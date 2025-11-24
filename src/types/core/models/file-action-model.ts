import { HTMLBlockElement } from "../html-block-element";
import { BlockModelInterface } from "./block-model";

export interface FileActionModelInterface {
  onLoad(): void;
  create(): HTMLElement;
  onClick(evt: Event): void;
  getId(): string;
  getName(): string;
  getName(): string;
  getItem(): HTMLElement;
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
