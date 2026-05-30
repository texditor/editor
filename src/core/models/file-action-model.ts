import type {
  FileActionModel as IFileActionModel,
  FileActionModelConfig,
  FileItemElement,
  FileActionModelConstructor,
  FileActionElement,
  BlockElement,
} from '@/types';
import BaseModel from '../base/base-model';

export default class FileActionModel extends BaseModel<FileActionElement> implements IFileActionModel {
  /**
   * Set up global configuration
   * @param config - Partial configuration
   * @returns Model constructor
   */
  public static setup(config: Partial<FileActionModelConfig>): FileActionModelConstructor {
    return super.setup(config) as FileActionModelConstructor;
  }

  /** @see IFileActionModel.getItemElement */
  getItemElement(): FileItemElement | null {
    const element = this.getElement();
    if (!element) return null;

    return element.closest('.tex-item');
  }

  /** @see IFileActionModel.getItemElement */
  getBlockElement(): BlockElement | null {
    const element = this.getElement();
    if (!element) return null;

    return element.closest('.tex-block');
  }

  /**
   * Parent model configuration
   * @returns Parent model configuration
   */
  protected parentConfig(): Partial<FileActionModelConfig> {
    return {
      __modelCode: 'fileAction',
      visibleTitle: false,
      className: 'tex-file-action',
    };
  }
}
