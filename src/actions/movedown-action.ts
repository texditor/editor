import type { ActionModelInterface, RenderIconContent } from "@/types";
import { IconArrowDown } from "@/icons";
import ActionModel from "@/core/models/action-model";

export default class MoveDownAction extends ActionModel implements ActionModelInterface {
  name = "moveDownAction";
  protected icon: RenderIconContent = IconArrowDown;

  onClick() {
    const { actions, blockManager, events } = this.editor;

    const curIndex = blockManager.getIndex(),
      curBlock = blockManager.getCurrentBlock();

    if (curBlock) {
      const nextBlock = blockManager.getByIndex(curIndex + 1);

      if (nextBlock) {
        curBlock?.insertAdjacentElement("beforebegin", nextBlock);

        events.change({
          type: "moveDown",
          index: curIndex + 1,
          block: curBlock,
          targetBlock: nextBlock,
          targetIndex: curIndex
        });

        events.refresh();

        const newBlock = blockManager.getByIndex(curIndex + 1),
          model = newBlock?.blockModel;

        if (model?.isEditable()) newBlock?.focus();
        else newBlock?.click();
      }
    }

    setTimeout(() => actions.show(), 40);
  }

  isVisible() {
    const { blockManager } = this.editor;
    return !(blockManager.getIndex() + 1 == blockManager.count());
  }
}
