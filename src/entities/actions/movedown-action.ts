import type { ActionModelConfig, ActionModelInterface } from "@/types";
import { IconArrowDown } from "@/icons";
import ActionModel from "@/core/models/action-model";
/** Move the block down */
export default class MoveDownAction extends ActionModel  {
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
      blockElement = this.getBlockElement();

    const model = blockElement?.baseModel;

    blockManager.moveBlock(curIndex, curIndex + 1);

    if (model)
      model.showActions();

  }

  isVisible(): boolean {
    const { blockManager } = this.editor;
    return !(blockManager.getIndex() + 1 == blockManager.count());
  }
}
