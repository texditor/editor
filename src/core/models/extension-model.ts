import Texditor from "@/texditor";
import { generateRandomString } from "@/utils/common";
import { addClass, append, make, removeClass } from "@/utils/dom";
import { off, on } from "@/utils/events";
import renderIcon from "@/utils/renderIcon";

export default class ExtensionModel {
  name: string = "";
  protected translation: string = "";
  protected editor: Texditor;
  protected icon: string = "";
  private randomId: string = generateRandomString(10);

  constructor(editor: Texditor) {
    this.editor = editor;
    this.onClick = this.onClick.bind(this);
    this.onLoad();
  }

  onLoad(): void {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onClick(evt: Event) {}

  isActive(): boolean {
    return true;
  }

  create() {
    const { api, events, config, i18n } = this.editor,
      cssName = api.css("extension", false);

    return make("div", (el: HTMLElement) => {
      addClass(el, cssName + " " + cssName + "-" + this.getName());
      events.add("onChange", () => {
        if (!this.isActive()) addClass(el, "tex-unactive");
        else removeClass(el, "tex-unactive");
      });

      off(el, "click.ext");
      on(el, "click.ext", this.onClick);
      el.id = this.getId();

      if (this.icon) {
        el.innerHTML = renderIcon(this.icon, {
          width: 14,
          height: 14
        });
      }

      if (config.get("extensionVisibleTitle", false)) {
        append(
          el,
          make("span", (span: HTMLSpanElement) => {
            span.textContent = i18n.get(this.translation || this.getName(), this.getName());
          })
        );
      }
    });
  }

  protected getId(): string {
    return this.editor.api.css("extension", false) + "-" + this.getName() + "-" + this.randomId;
  }

  protected getElement(): HTMLElement | null {
    return document.getElementById(this.getId());
  }

  protected getName() {
    return this.name;
  }
}
