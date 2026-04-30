import type {
  FileActionModelInterface,
  FileActionModelConfig,
  FileItemNode,
  FileActionModelConstructor,
  FileActionNode,
  BlockNode
} from "@/types";
import BaseModel from "./base-model";

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

  setItemNode(itemNode: FileItemNode): void {
    this.itemNode = itemNode;
  }

  getItemNode(): FileItemNode | null {
    return this.itemNode || null;
  }

  setBlockNode(blockNode: BlockNode): void {
    this.blockNode = blockNode;
  }

  getBlockNode(): BlockNode | null {
    return this.blockNode || null;
  }

  /**
 * Parent model configuration
 * @returns Parent model configuration
 */
  protected parentСonfig(): Partial<FileActionModelConfig> {
    return {
      __modelCode: 'fileAction',
      visibleTitle: false,
      className: 'tex-file-action'
    }
  }
}