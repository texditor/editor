import Texditor from "@/texditor";
import { generateRandomString } from "@/utils/common";
import { addClass, append, make } from "@/utils/dom";
import { on } from "@/utils/events";
import renderIcon from "@/utils/renderIcon";

export default class ActionModel {
  protected name: string = "";
  protected translation: string = "";
  protected editor: Texditor;
  protected icon: string = "";
  protected menu: boolean = false;
  protected confirm: boolean = false;
  private randomId: string = generateRandomString(10);

  constructor(editor: Texditor) {
    this.editor = editor;
    this.onLoad();
    this.editor.events.add("actions:render:end", () => {
      const element = this.getElement();

      if (element) {
        element.style.display = !this.isVisible() ? "none" : "";
      }
    });
  }

  protected onLoad(): void {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected onClick(evt: Event) {}

  protected menuConfig(): {
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
    const { actions, api, i18n, toolbar } = this.editor;

    if (this.confirm) {
      const element = this.getElement(),
        cssName = api.css("action", false);

      setTimeout(() => {
        actions.show();

        if (element) {
          element.style.display = "none";
          element?.insertAdjacentElement(
            "beforebegin",
            make("div", (cfm: HTMLElement) => {
              addClass(cfm, cssName + " " + cssName + "-confirm " + cssName + "-" + this.getName() + "-confirm");

              if (this.icon) {
                cfm.innerHTML = renderIcon(this.icon, {
                  width: 20,
                  height: 20
                });
              }

              cfm.innerHTML += i18n.get("confirmAction", "Confirm deletion");

              on(cfm, "click.am", () => {
                this.onClick(evt);
                cfm.remove();
                element.style.display = "";
              });
            })
          );
        }
      }, 1);
    } else if (this.menu) {
      setTimeout(() => {
        const { items, title } = this.menuConfig();
        actions.show();
        actions.showMenu(items, title);
      }, 1);
    } else this.onClick(evt);

    toolbar.hide();
  }

  protected getId(): string {
    return this.editor.api.css("action", false) + "-" + this.getName() + "-" + this.randomId;
  }

  protected getElement(): HTMLElement | null {
    return document.getElementById(this.getId());
  }

  protected getName() {
    return this.name;
  }

  create() {
    const { api, i18n } = this.editor,
      cssName = api.css("action", false);

    return make("div", (el: HTMLElement) => {
      addClass(el, cssName + " " + cssName + "-" + this.getName());

      el.id = this.getId();

      if (this.icon) {
        el.innerHTML = renderIcon(this.icon, {
          width: 14,
          height: 14
        });
      }

      append(
        el,
        make("span", (span: HTMLSpanElement) => {
          span.textContent = i18n.get(this.translation || this.getName(), this.getName());
        })
      );
    });
  }

  applyEvents() {
    const element = this.getElement();

    this.handleClick = this.handleClick.bind(this);

    if (element) on(element, "click.am", this.handleClick);
  }

  protected isVisible() {
    return true;
  }
}
