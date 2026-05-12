import type { FileActionModelConfig } from "@/types";
import { IconArrowRight } from "@/icons";
import FileActionModel from "@/core/models/file-action-model";

export default class MoveRightFileAction extends FileActionModel {
  protected configure(): Partial<FileActionModelConfig> {
    return {
      name: 'moveRight',
      icon: IconArrowRight
    }
  }

  onClick() {
    const blockElement = this.getBlockElement();
    const itemElement = this.getItemElement();
    const model = blockElement?.baseModel;

    if (blockElement && model && itemElement) {
      const index = model.getItemIndex(itemElement);
      model.moveItem(index, index + 1);
    }
  }

  isVisible(): boolean {
    const blockElement = this.getBlockElement();
    const itemElement = this.getItemElement();
    const model = blockElement?.baseModel;

    if (blockElement && model && itemElement)
      return model.getItemIndex(itemElement) + 1 < model.getItemsLength();

    return false;
  }
}
