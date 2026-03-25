import type {
  CustomEvent,
  ExtensionModelInterface,
  ExtensionNode,
  RenderIconContent,
  TexditorInterface
} from "@/types";
import { generateRandomString } from "@/utils/common";
import {
  addClass,
  append,
  attr,
  html,
  make,
  removeClass,
  toggleClass
} from "@/utils/dom";
import { off, on, rebind } from "@/utils/events";
import { renderIcon } from "@/utils/icon";

export default class ExtensionModel implements ExtensionModelInterface {
  name: string = "";
  protected translation: string = "";
  protected editor: TexditorInterface;
  protected icon: RenderIconContent = "";
  protected toggleActive: boolean = true;
  private randomId: string = generateRandomString(10);
  protected groupName = "";

  constructor(editor: TexditorInterface) {
    this.editor = editor;
    this.onLoad();
    this.handleClick = this.handleClick.bind(this);
  }

  onLoad(): void { }

  onClick(_evt: CustomEvent): void { }

  handleClick(evt: CustomEvent) {
    if (this.toggleActive) {
      if (evt.el) {
        toggleClass(
          evt.el as HTMLElement,
          "tex-extension-active"
        );
      }
    }

    this.onClick(evt);
  }

  isActive(): boolean {
    return true;
  }

  create(): HTMLElement {
    const { events, config, i18n } = this.editor,
      cssName = "tex-extension";

    return make("div", (el: ExtensionNode) => {
      addClass(el, cssName + " " + cssName + "-" + this.getName());
      rebind(el, "click.ext", this.handleClick);
      el.id = this.getId();

      events.add("onChange", () => {
        if (!this.isActive()) addClass(el, cssName + "-unactive");
        else removeClass(el, cssName + "-unactive");
      });

      if (this.icon) {
        html(
          el,
          renderIcon(this.icon, {
            width: 14,
            height: 14
          })
        )
      }

      const title = i18n.get(
        this.translation || this.getName(),
        this.getName()
      );

      attr(el, "title", title);

      if (config.get("extensionVisibleTitle", false)) {
        append(
          el,
          make("span", (span: HTMLSpanElement) => (span.textContent = title))
        );
      }
      el.extensionModel = this;
    });
  }

  getId(): string {
    return ("tex-extension" + "-" + this.getName() + "-" + this.randomId);
  }

  getBlockNode(): HTMLElement | null {
    return document.getElementById(this.getId());
  }

  getName(): string {
    return this.name;
  }

  getGroupName(): string {
    return this.groupName;
  }
}
