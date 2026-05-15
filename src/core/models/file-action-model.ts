import type {
  FileActionModel as IFileActionModel,
  FileActionModelConfig,
  FileItemElement,
  FileActionModelConstructor,
  FileActionElement,
  BlockElement
} from "@/types";
import BaseModel from "../base/base-model";

export default class FileActionModel extends BaseModel<FileActionElement> implements IFileActionModel {
  private itemElement?: FileItemElement;
  private blockElement?: BlockElement;
  /**
  * Set up global configuration
  * @param config - Partial configuration
  * @returns Model constructor
  */
  public static setup(
    config: Partial<FileActionModelConfig>
  ): FileActionModelConstructor {
    return super.setup(config) as FileActionModelConstructor;
  }

  /** @see IFileActionModel.getItemElement */
  getItemElement(): FileItemElement | null {
    return this.itemElement || null;
  }

  /** @see IFileActionModel.getItemElement */
  getBlockElement(): BlockElement | null {
    return this.blockElement || null;
  }

  /**
   * Sets the block and item elements.
   * @param blockElement - The block element to set.
   * @param itemElement - The file item element to set.
   */
  __setElements(
    blockElement: BlockElement,
    itemElement: FileItemElement
  ): void {
    this.blockElement = blockElement;
    this.itemElement = itemElement;
  }

  /**
 * Parent model configuration
 * @returns Parent model configuration
 */
  protected parentConfig(): Partial<FileActionModelConfig> {
    return {
      __modelCode: 'fileAction',
      visibleTitle: false,
      className: 'tex-file-action'
    }
  }
}