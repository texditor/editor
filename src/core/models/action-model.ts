import type {
  ActionModelConfig,
  ActionModel as IActionModel,
  ActionModelConstructor,
  ActionElement,
  BlockElement
} from "@/types";
import { IconArrowRight } from "@/icons";
import {
  addClass,
  append,
  before,
  css,
  html,
  make,
  on,
  query
} from "snappykit";
import { renderIcon } from "@/utils/icon";
import BaseModel from "../base/base-model";

export default class ActionModel extends BaseModel<ActionElement> implements IActionModel {
  /**
  * Set up global configuration
  * @param config - Partial configuration
  * @returns Model constructor
  */
  public static setup(
    config: Partial<ActionModelConfig>
  ): ActionModelConstructor {
    return super.setup(config) as ActionModelConstructor;
  }

  /**
   * @see IActionModel.getBlockElement
   */
  getBlockElement(): BlockElement | null {
    const element = this.getElement();
    if (!element) return null;

    return element.closest('.tex-block');
  }

  /**
   * Parent model configuration
   * @returns Parent model configuration
   */
  protected parentConfig(): Partial<ActionModelConfig> {
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
  protected parentOnCreateElement(el: ActionElement): void {
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

    if (this.isDropdown()) append(el, moreIcon);
  }

  /**
   * Handle confirmation flow for actions that require user verification
   * @param evt - Basic event
   */
  protected confirm(evt: MouseEvent): void {
    const { events, i18n } = this.editor,
      cssName = "tex-action",
      element = this.getElement(),
      icon = this.getIcon();

    if (element) {
      css(element, 'display', 'none');
      before(
        element,
        make("div", (cfm: HTMLElement) => {
          addClass(
            cfm,
            cssName + " " + cssName + "-confirm " +
            cssName + "-" + this.getName() + "-confirm"
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

          cfm.innerHTML += i18n.get("confirmAction", "Confirm action");

          on(cfm, "click.am", () => {
            this.onClick(evt);
            cfm.remove();
            css(element, 'display', '');
            events.refresh();
          });
        })
      );
    }
  }

  /**
   * Parent hook called after model node clicked
   * @param evt - Basic event
   * @returns void
   */
  protected parentOnClick(evt: MouseEvent): void {
    const { events, tools } = this.editor;
    const blockElement = this.getBlockElement();

    if (blockElement) {
      if (this.isConfirm()) {
        this.confirm(evt);
      } else if (this.isDropdown()) {
        const cssContent = 'tex-actions-content',
          dropdownElement = this.dropdown();

        query('.' + cssContent + '-body', (body: HTMLDivElement) => html(body, ''), blockElement);
        query('.' + cssContent + '-dropdown', (dropdown: HTMLDivElement) => {
          append(dropdown, dropdownElement);
          addClass(dropdown, 'tex-active');
        }, blockElement);
      } else {
        this.onClick(evt);
        events.refresh();
      }

      tools.hide();
    }
  }

  /**
   * Create and return the dropdown menu element
   * @returns Empty div element as placeholder for dropdown content
   */
  protected dropdown(): HTMLElement {
    return make('div');
  }

  /**
   * Check if action shows a menu on click
   * @returns True if action has a menu, false otherwise
   */
  isDropdown(): boolean {
    return this.getConfig('dropdown', false);
  }

  /**
   * @see IActionModel.isConfirm
   */
  isConfirm(): boolean {
    return this.getConfig('confirm', false);
  }
}