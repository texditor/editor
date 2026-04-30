import type { FileActionModelConfig, FileActionModelInterface } from "@/types";
import { IconArrowRight } from "@/icons";
import FileActionModel from "@/core/models/file-action-model";

export default class MoveRightFileAction extends FileActionModel implements FileActionModelInterface {
  protected configure(): Partial<FileActionModelConfig> {
    return {
      name: 'moveRight',
      icon: IconArrowRight
    }
  }

  onClick() {
    const blockNode = this.getBlockNode();
    const itemNode = this.getItemNode();
    const model = blockNode?.baseModel;

    if (blockNode && model && itemNode) {
      const index = model.getItemIndex(itemNode);
      model.moveItem(index, index + 1);
    }
  }

  isVisible(): boolean {
    const blockNode = this.getBlockNode();
    const itemNode = this.getItemNode();
    const model = blockNode?.baseModel;

    if (blockNode && model && itemNode)
      return model.getItemIndex(itemNode) + 1 < model.getItemsLength();

    return false;
  }
}
