import type { ActionModelConfig, ActionModelInterface } from "@/types";
import { IconArrowDown } from "@/icons";
import ActionModel from "@/core/models/action-model";
/** Move the block down */
export default class MoveDownAction extends ActionModel implements ActionModelInterface {
  protected configure(): Partial<ActionModelConfig> {
    return {
      name: 'moveDownAction',
      translation: 'moveDownAction',
      icon: IconArrowDown,
    };
  }

  protected onClick(): void {
    const { blockManager } = this.editor;
    const curIndex = blockManager.getIndex(),
      blockNode = this.getBlockNode();

    const model = blockNode?.baseModel;

    blockManager.moveBlock(curIndex, curIndex + 1);

    if (model)
      model.showActions();

  }

  isVisible(): boolean {
    const { blockManager } = this.editor;
    return !(blockManager.getIndex() + 1 == blockManager.count());
  }
}
