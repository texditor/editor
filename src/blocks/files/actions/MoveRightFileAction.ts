import { IconArrowRight } from "@/icons";
import type { FileActionModelInterface } from "@/types";
import FileActionModel from "@/core/models/file-action-model";

export default class MoveRightFileAction extends FileActionModel implements FileActionModelInterface {
  name: string = "moveRight";
  protected icon: string = IconArrowRight;

  private use() {
    const model = this.getCurrentBlockModel(),
      currentItem = this.getItem();

    return {
      model,
      currentItem
    };
  }

  onClick() {
    const { model, currentItem } = this.use();

    if (currentItem && model?.moveItem) {
      model.moveItem(currentItem, (model?.getItem(currentItem || 0) as number) + 1);
    }
  }

  isVisible(): boolean {
    const { model, currentItem } = this.use();

    if (!model.getItemsLength) return false;

    return (model?.getItem(currentItem || 0) as number) !== model.getItemsLength() - 1;
  }
}
