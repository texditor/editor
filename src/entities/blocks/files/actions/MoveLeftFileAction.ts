import type { FileActionModelConfig, FileActionModelInterface } from "@/types";
import { IconArrowLeft } from "@/icons";
import FileActionModel from "@/core/models/file-action-model";

export default class MoveLeftFileAction extends FileActionModel implements FileActionModelInterface {
  protected configure(): Partial<FileActionModelConfig> {
    return {
      name: 'moveLeft',
      icon: IconArrowLeft
    }
  }

  onClick() {
    const blockElement = this.getBlockNode();
    const itemNode = this.getItemNode();
    const model = blockElement?.baseModel;

    if (blockElement && model && itemNode) {
      const index = model.getItemIndex(itemNode);
      model.moveItem(index, index - 1);
    }
  }

  isVisible(): boolean {
    const blockElement = this.getBlockNode();
    const itemNode = this.getItemNode();
    const model = blockElement?.baseModel;

    if (blockElement && model && itemNode) 
      return model.getItemIndex(itemNode) > 0;
    
    return false;
  }
}
