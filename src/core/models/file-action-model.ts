import Texditor from "@/texditor";
import type { BlockModelInterface, FileActionModelInterface, HTMLBlockElement, RenderIconContent } from "@/types";
import { generateRandomString } from "@/utils/common";
import { addClass, append, make, query } from "@/utils/dom";
import { on } from "@/utils/events";
import { renderIcon } from "@/utils/icon";

export default class FileActionModel implements FileActionModelInterface {
  name: string = "";
  className: string = "";
  protected translation: string = "";
  protected defaultTitle: string = "";
  protected tagName: string = "div";
  protected editor: Texditor;
  protected icon: RenderIconContent = "";
  protected prepare: boolean = false;
  private randomId: string = generateRandomString(10);
  private item: HTMLElement;
  private container: HTMLElement;
  private currentBlock: HTMLBlockElement;

  constructor(
    editor: Texditor,
    item: HTMLElement,
    container: HTMLElement,
    fileBlock: HTMLBlockElement
  ) {
    this.editor = editor;
    this.item = item;
    this.container = container;
    this.currentBlock = fileBlock;
    this.onLoad();

    this.editor.events.add("file:actions:render:end", () => {
      this.refresh();
    });
  }

  onLoad(): void { }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onClick(evt: Event) { }

  onCreate(el: HTMLElement): HTMLElement {
    return el;
  }

  menuConfig(): {
    title: string;
    items: [] | HTMLElement[];
    onCreate?: CallableFunction;
  } {
    return {
      title: "",
      items: []
    };
  }

  private handleClick(evt: Event) {
    this.onClick(evt);

    const eventTriggrer = () => {
      const eventName = this.getName() + "FileItem";
      if (eventName) {
        this.editor.events.change({
          type: eventName,
          block: this.getCurrentBlock(),
          item: this.getItem(),
          index: this.getItemIndex(),
          container: this.getContainer(),
          isFileAction: true,
        });
      }
    };

    if (this.prepare) {
      const menu = this.render();
      if (menu) append(this.getCurrentBlock(), menu);
    } else {
      this.refresh();
      eventTriggrer();
    }
  }

  protected render(): HTMLElement | null {
    return null;
  }

  getId(): string {
    return this.editor.api.css("editor", false) + "-file-action-" + this.getName() + "-" + this.randomId;
  }

  getElement(): HTMLElement | null {
    return document.getElementById(this.getId());
  }

  getName(): string {
    return this.name;
  }

  getItem(): HTMLElement {
    return this.item;
  }

  getItemIndex(): number {
    const block = this.getCurrentBlock();
    let realIndex = 0

    query('.tex-file', (file: HTMLDivElement, index: number) => {
      if (file === this.getItem()) {
        realIndex = index;
      }
    }, block);

    return realIndex;
  }

  getContainer(): HTMLElement {
    return this.container;
  }

  getCurrentBlock(): HTMLBlockElement {
    return this.currentBlock;
  }

  getCurrentBlockModel(): BlockModelInterface {
    return this.currentBlock.blockModel;
  }

  create(): HTMLElement {
    const cssName = "tex-files-action-item-" + this.getName() + " " + this.className;

    this.handleClick = this.handleClick.bind(this);

    const elem = make(this.tagName, (act: HTMLDivElement) => {
      act.id = this.getId();
      addClass(act, "tex-files-action " + cssName);
      act.setAttribute(
        'title',
        this.editor.i18n.get(
          this.translation,
          this.defaultTitle)
      );

      Object.defineProperty(act, "fileAction", {
        value: this,
        writable: true
      });

      if (this.icon) {
        act.innerHTML = renderIcon(this.icon, {
          width: 18,
          height: 18
        });
      }

      on(act, "click.fileAction", (evt) => {
        this.handleClick(evt);
      });
    });

    this.onCreate(elem);

    return this.onCreate(elem);
  }

  refresh(): void {
    const element = this.getElement();

    if (element) element.style.display = !this.isVisible() ? "none" : "";
  }

  isVisible() {
    return true;
  }
}
