import type { ActionModelConfig, ActionModelInterface } from "@/types";
import { IconArrowUp } from "@/icons";
import ActionModel from "@/core/models/action-model";

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
    const { blockManager } = this.editor;
    const curIndex = blockManager.getIndex(),
      blockElement = this.getBlockElement();

    const model = blockElement?.baseModel;

    blockManager.moveBlock(curIndex, curIndex - 1);

    if (model)
      model.showActions();
  }

  isVisible(): boolean {
    const { blockManager } = this.editor;
    return blockManager.getIndex() > 0 && blockManager.count() !== 0;
  }
}
