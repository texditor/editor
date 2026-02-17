import { IconArrowLeft } from "@/icons";
import type { FileActionModelInterface, RenderIconContent } from "@/types";
import FileActionModel from "@/core/models/file-action-model";

export default class MoveLeftFileAction extends FileActionModel implements FileActionModelInterface {
  name: string = "moveLeft";
  protected icon: RenderIconContent = IconArrowLeft;
  protected translation: string = "moveLeft";
  protected defaultTitle: string = "Move left";

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
      model.moveItem(currentItem, (model?.getItem(currentItem || 0) as number) - 1);
    }
  }

  isVisible(): boolean {
    const { model, currentItem } = this.use();

    return (model?.getItem(currentItem || 0) as number) !== 0;
  }
}
