import type {
  ExtensionModelInterface,
  RenderIconContent,
  TexditorInterface
} from "@/types";
import { generateRandomString } from "@/utils/common";
import { addClass, append, attr, make, removeClass, toggleClass } from "@/utils/dom";
import { off, on } from "@/utils/events";
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onClick(evt: Event & { el: EventTarget }): void { }

  handleClick(evt: Event & { el: EventTarget }) {
    const { api } = this.editor,
      cssName = api.css("extension", false);

    if (this.toggleActive) {
      if (evt.el) toggleClass(evt.el as HTMLElement, cssName + "-active");
    }
    this.onClick(evt);
  }

  isActive(): boolean {
    return true;
  }

  create(): HTMLElement {
    const { api, events, config, i18n } = this.editor,
      cssName = api.css("extension", false);

    return make("div", (el: HTMLElement) => {
      addClass(el, cssName + " " + cssName + "-" + this.getName());

      events.add("onChange", () => {
        if (!this.isActive()) addClass(el, cssName + "-unactive");
        else removeClass(el, cssName + "-unactive");
      });

      off(el, "click.ext");
      on(el, "click.ext", this.handleClick);
      el.id = this.getId();

      if (this.icon) {
        el.innerHTML = renderIcon(this.icon, {
          width: 14,
          height: 14
        });
      }

      const title = i18n.get(this.translation || this.getName(), this.getName());

      attr(el, "title", title);

      if (config.get("extensionVisibleTitle", false))
        append(
          el,
          make("span", (span: HTMLSpanElement) => (span.textContent = title))
        );
    });
  }

  getId(): string {
    return this.editor.api.css("extension", false) + "-" + this.getName() + "-" + this.randomId;
  }

  getElement(): HTMLElement | null {
    return document.getElementById(this.getId());
  }

  getName(): string {
    return this.name;
  }

  getGroupName(): string {
    return this.groupName;
  }
}
