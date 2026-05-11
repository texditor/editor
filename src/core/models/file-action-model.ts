import type {
  FileActionModelInterface,
  FileActionModelConfig,
  FileItemNode,
  FileActionModelConstructor,
  FileActionNode,
  BlockNode
} from "@/types";
import BaseModel from "../base/base-model";

export default class FileActionModel extends BaseModel<FileActionNode> implements FileActionModelInterface {
  private itemNode?: FileItemNode;
  private blockNode?: BlockNode;
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

  __setElements(blockNode: BlockNode, itemNode: FileItemNode): void {
    this.blockNode = blockNode;
    this.itemNode = itemNode;
  }

  getBlockNode(): BlockNode | null {
    return this.blockNode || null;
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