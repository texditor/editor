import type {
  FileActionModelInterface,
  RenderIconContent
} from "@/types";
import { IconArrowRight } from "@/icons";
import FileActionModel from "@/core/models/file-action-model";

export default class MoveRightFileAction extends FileActionModel implements FileActionModelInterface {
  name: string = "moveRight";
  protected icon: RenderIconContent = IconArrowRight;
  protected translation: string = "moveRight";
  protected defaultTitle: string = "Move right";

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
