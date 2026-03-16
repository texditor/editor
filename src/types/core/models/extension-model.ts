import type { CustomEvent, TexditorInterface } from "@/types";

export interface ExtensionNode extends HTMLElement {
  extensionModel: ExtensionModelInterface;
}

export interface ExtensionModelInstanceInterface {
  new(editor: TexditorInterface): ExtensionModelInterface;
}
export interface ExtensionModelInterface {
  onLoad?(): void;
  create?(): HTMLElement;
  onClick?(evt: CustomEvent): void;
  getName?(): string;
  getId?(): string;
  getElement?(): HTMLElement | null;
  getGroupName?(): string;
  isActive?(): boolean;
  name: string;
}
