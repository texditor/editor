import type { ActionModelInterface, RenderIconContent } from "@/types";
import { IconArrowUp } from "@/icons";
import ActionModel from "@/core/models/action-model";

export default class MoveUpAction extends ActionModel implements ActionModelInterface {
  name = "moveUpAction";
  protected icon: RenderIconContent = IconArrowUp;

  onClick() {
    const { actions, blockManager, events } = this.editor;

    const curIndex = blockManager.getIndex(),
      curBlock = blockManager.getCurrentBlock();

    if (curIndex > 0 && curBlock) {
      const prevBlock = blockManager.getByIndex(curIndex - 1);

      if (prevBlock) {
        curBlock?.insertAdjacentElement("afterend", prevBlock);

        events.change({
          type: "moveUp",
          index: curIndex - 1,
          block: curBlock,
          targetBlock: prevBlock,
          targetIndex: curIndex
        });

        events.refresh();

        const newBlock = blockManager.getByIndex(curIndex - 1),
          model = newBlock?.blockModel;

        if (model?.isEditable()) newBlock?.focus();
        else newBlock?.click();
      }
    }

    setTimeout(() => actions.show(), 40);
  }

  isVisible() {
    const { blockManager } = this.editor;
    return blockManager.getIndex() > 0 && blockManager.count() !== 0;
  }
}
