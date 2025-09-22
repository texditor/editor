export interface ExtensionModelInterface {
  onLoad?(): void;
  create?(): HTMLElement;
  onClick?(evt: Event & { el: EventTarget }): void;
  getName?(): string;
  getId?(): string;
  getElement?(): HTMLElement | null;
  getGroupName?(): string;
  name: string;
}
