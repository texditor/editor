import type {
  BaseEvent,
  ExtensionModelConfig,
  ExtensionModelConstructor,
  ExtensionModelInterface,
  ExtensionElement,
} from "@/types";

import { toggleClass } from "@/utils/dom";
import BaseModel from "../base/base-model";

export default class ExtensionModel extends BaseModel<ExtensionElement>  {
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
  protected parentConfig(): Partial<ExtensionModelConfig> {
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
   */
  protected parentOnClick(evt: BaseEvent): void {
    if (this.isToggleActive()) {
      if (evt.delegateTarget) {
        toggleClass(
          evt.delegateTarget as HTMLElement,
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