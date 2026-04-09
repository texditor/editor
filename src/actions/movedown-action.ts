import type { ActionModelConfig, ActionModelInterface } from "@/types";
import { IconArrowDown } from "@/icons";
import ActionModel from "@/core/models/action-model";
import { before } from "@/utils";
/** Move the block down */
export default class MoveDownAction
  extends ActionModel
  implements ActionModelInterface {

  protected configure(): Partial<ActionModelConfig> {
    return {
      name: 'moveDownAction',
      translation: 'moveDownAction',
      icon: IconArrowDown,
    };
  }

  protected onClick(): void {
    const { actions, blockManager, events } = this.editor;
    const curIndex = blockManager.getIndex(),
      curBlock = blockManager.getNode();

    if (curBlock) {
      const nextBlock = blockManager.getNode(curIndex + 1);

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

  isVisible(): boolean {
    const { blockManager } = this.editor;
    return !(blockManager.getIndex() + 1 == blockManager.count());
  }
}
