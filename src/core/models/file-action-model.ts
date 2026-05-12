import type {
  FileActionModel as IFileActionModel,
  FileActionModelConfig,
  FileItemElement,
  FileActionModelConstructor,
  FileActionElement,
  BlockElement
} from "@/types";
import BaseModel from "../base/base-model";

export default class FileActionModel extends BaseModel<FileActionElement>  implements IFileActionModel {
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

  getItemElement(): FileItemElement | null {
    return this.itemElement || null;
  }

  __setElements(blockElement: BlockElement, itemElement: FileItemElement): void {
    this.blockElement = blockElement;
    this.itemElement = itemElement;
  }

  getBlockElement(): BlockElement | null {
    return this.blockElement || null;
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