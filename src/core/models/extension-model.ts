import type {
  ExtensionModelConfig,
  ExtensionModelConstructor,
  ExtensionModel as IExtensionModel,
  ExtensionElement,
} from '@/types';

import { toggleClass } from 'snappykit';
import BaseModel from '../base/base-model';

export default class ExtensionModel extends BaseModel<ExtensionElement> implements IExtensionModel {
  /**
   * Set up global configuration
   * @param config - Partial configuration
   * @returns Model constructor
   */
  public static setup(
    this: ExtensionModelConstructor,
    config: Partial<ExtensionModelConfig>,
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
      visibleTitle: config.get('extensionVisibleTitle', false),
      toggleActive: false,
      groupName: '',
    };
  }

  /**
   * Handle click with toggle functionality
   * @param evt - Custom event with element reference
   */
  protected parentOnClick(evt: MouseEvent): void {
    if (this.isToggleActive()) {
      if (evt.delegateTarget) {
        toggleClass(evt.delegateTarget as HTMLElement, 'tex-extension-active');
      }
    }

    this.onClick(evt);
  }

  /** @see IExtensionModel.isToggleActive */
  isToggleActive(): boolean {
    return this.getConfig('toggleActive', false);
  }

  /** @see IExtensionModel.getGroupName */
  getGroupName(): string {
    return this.getConfig('groupName', '');
  }
}
