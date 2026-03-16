import type { ActionModelInterface, RenderIconContent } from "@/types";
import { IconArrowDown } from "@/icons";
import ActionModel from "@/core/models/action-model";
import { before } from "@/utils";
/** Move the block down */
export default class MoveDownAction
  extends ActionModel
  implements ActionModelInterface {
  name = "moveDownAction";
  protected icon: RenderIconContent = IconArrowDown;

  onClick() {
    const { actions, blockManager, events } = this.editor;

    const curIndex = blockManager.getIndex(),
      curBlock = blockManager.getBlockNode();

    if (curBlock) {
      const nextBlock = blockManager.getBlockNode(curIndex + 1);

      if (curBlock && nextBlock) {
        before(curBlock, nextBlock);

        events.change({
          type: "moveDown",
          index: curIndex + 1,
          blockNode: curBlock,
          targetBlockElement: nextBlock,
          targetIndex: curIndex
        });

        blockManager.focus(curIndex + 1);
      }

    }

    setTimeout(() => actions.show(), 40);
  }

  isVisible() {
    const { blockManager } = this.editor;
    return !(blockManager.getIndex() + 1 == blockManager.count());
  }
}
