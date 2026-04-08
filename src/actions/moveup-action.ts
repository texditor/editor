import type { ActionModelConfig, ActionModelInterface } from "@/types";
import { IconArrowUp } from "@/icons";
import ActionModel from "@/core/models/action-model";
import { after } from "@/utils";

/** Move the block up */
export default class MoveUpAction extends ActionModel implements ActionModelInterface {

  protected configure(): Partial<ActionModelConfig> {
    return {
      name: 'moveUpAction',
      translation: 'moveUpAction',
      icon: IconArrowUp,
    };
  }

  protected onClick(): void {
    const { actions, blockManager, events } = this.editor;

    const curIndex = blockManager.getIndex(),
      curBlock = blockManager.getBlockNode();

    if (curIndex > 0 && curBlock) {
      const prevBlock = blockManager.getBlockNode(curIndex - 1);

      if (curBlock && prevBlock) {
        after(curBlock, prevBlock);

        events.change({
          type: "moveUp",
          index: curIndex - 1,
          blockNode: curBlock,
          targetBlockElement: prevBlock,
          targetIndex: curIndex
        });

        blockManager.focus(curIndex - 1);
      }
    }

    setTimeout(() => actions.show(), 40);
  }

  isVisible() {
    const { blockManager } = this.editor;
    return blockManager.getIndex() > 0 && blockManager.count() !== 0;
  }
}
