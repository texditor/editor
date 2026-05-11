import type {
  FileActionModelInterface,
  FileActionModelConfig,
  FileItemNode,
  FileActionModelConstructor,
  FileActionElement,
  BlockElement
} from "@/types";
import BaseModel from "../base/base-model";

// TODO: отказ от постфикса Interface и implements в классах
export default class FileActionModel extends BaseModel<FileActionElement> implements FileActionModelInterface {
  private itemNode?: FileItemNode;
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

  getItemNode(): FileItemNode | null {
    return this.itemNode || null;
  }

  __setElements(blockElement: BlockElement, itemNode: FileItemNode): void {
    this.blockElement = blockElement;
    this.itemNode = itemNode;
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