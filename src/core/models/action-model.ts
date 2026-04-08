import type {
  ActionModelConfig,
  ActionModelInterface,
  BaseNode,
  BaseEvent,
  ActionModelConstructor
} from "@/types";
import { IconArrowRight } from "@/icons";
import { addClass, append, before, css, html, make } from "@/utils/dom";
import { on } from "@/utils/events";
import { renderIcon } from "@/utils/icon";
import BaseModel from "./base-model";

export default class ActionModel extends BaseModel implements ActionModelInterface {
  /**
  * Set up global configuration
  * @param config - Partial configuration
  * @returns Model constructor
  */
  public static setup(
    this: ActionModelConstructor,
    config: Partial<ActionModelConfig>
  ): ActionModelConstructor {
    return super.setup(config) as ActionModelConstructor;
  }

  /**
 * Parent model configuration
 * @returns Parent model configuration
 */
  protected parentСonfig(): Partial<ActionModelConfig> {
    return {
      __modelCode: 'action',
      visibleTitle: true,
      menu: false,
      confirm: false
    }
  }

  /**
 * Parent hook called after model node creation
 * @param el - Created model node
 * @returns void
 */
  protected parentOnCreate(el: BaseNode): void {
    const cssName = 'tex-action';

    if (this.isConfirm())
      addClass(el, cssName + '-verifiable');

    const moreIcon = make("span", (span: HTMLSpanElement) => {
      html(
        span,
        renderIcon(IconArrowRight, {
          width: 12,
          height: 12
        })
      );
    });

    if (this.isMenu()) append(el, moreIcon);
  }

  /**
   * Menu configuration
   * @returns Menu configuration object with title and items
   */
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

  protected parentOnClick(evt: BaseEvent): void {
    const { actions, events, i18n, tools } = this.editor;

    if (this.isConfirm()) {
      const element = this.getNode(),
        icon = this.getIcon(),
        cssName = "tex-action";

      setTimeout(() => {
        actions.show();

        if (element) {
          css(element, 'display', 'none');
          before(
            element,
            make("div", (cfm: HTMLElement) => {
              addClass(
                cfm,
                cssName +
                " " +
                cssName +
                "-confirm " +
                cssName +
                "-" +
                this.getName() +
                "-confirm"
              );

              if (icon) {
                html(
                  cfm,
                  renderIcon(icon, {
                    width: 20,
                    height: 20
                  })
                );
              }

              cfm.innerHTML += i18n.get("confirmAction", "Confirm deletion");

              on(cfm, "click.am", () => {
                this.onClick(evt);
                cfm.remove();
                element.style.display = "";
                events.refresh();
              });
            })
          );
        }
      }, 1);
    } else if (this.isMenu()) {
      setTimeout(() => {
        const { items, title } = this.menuConfig();
        actions.show();
        actions.showMenu(items, title);
      }, 1);
    } else {
      this.onClick(evt);
      events.refresh();
    }

    tools.hide();
  }

  /**
   * Check if action shows a menu on click
   * @returns True if action has a menu, false otherwise
   */
  isMenu(): boolean {
    return this.getConfig('menu', false);
  }

  /**
   * Check if action requires confirmation before execution
   * @returns True if confirmation is required, false otherwise
   */
  isConfirm(): boolean {
    return this.getConfig('confirm', false);
  }
}