import type {
  BaseEvent,
  ExtensionModelConfig,
  ExtensionModelConstructor,
  ExtensionModelInterface,
  ExtensionNode,
} from "@/types";

import { toggleClass } from "@/utils/dom";
import BaseModel from "./base-model";

export default class ExtensionModel extends BaseModel<ExtensionNode> implements ExtensionModelInterface {
  /**
   * Set up global configuration
   * @param config - Partial configuration
   * @returns Model constructor
   */
  public static setup(
    this: ExtensionModelConstructor,
    config: Partial<ExtensionModelConfig>
  ): ExtensionModelConstructor {
    return super.setup(config) as ExtensionModelConstructor;
  }

  /**
   * Parent model configuration
   * @returns Parent model configuration
   */
  protected parentСonfig(): Partial<ExtensionModelConfig> {
    const { config } = this.editor;

    return {
      __modelCode: 'extension',
      visibleTitle: config.get("extensionVisibleTitle", false),
      menu: false,
      confirm: false
    }
  }

  /**
   * Handle click with toggle functionality
   * @param evt - Custom event with element reference
   * @returns void
   */
  protected parentOnClick(evt: BaseEvent): void {
    if (this.isToggleActive()) {
      if (evt.el) {
        toggleClass(
          evt.el as HTMLElement,
          "tex-extension-active"
        );
      }
    }

    this.onClick(evt);
  }

  /**
   * Check if extension toggles active state on click
   * @returns True if toggle active is enabled
   */
  isToggleActive(): boolean {
    return this.getConfig('toggleActive', false);
  }

  /**
   * Get group name for categorization
   * @returns Group name string
   */
  getGroupName(): string {
    return this.getConfig('groupName', '');
  }
}