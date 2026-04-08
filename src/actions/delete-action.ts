import type { ActionModelConfig, ActionModelInterface } from "@/types";
import { IconTrash } from "@/icons";
import ActionModel from "@/core/models/action-model";

/** Delete a block */
export default class DeleteAction
  extends ActionModel
  implements ActionModelInterface {

  protected configure(): Partial<ActionModelConfig> {
    return {
      name: 'deleteAction',
      translation: 'deleteAction',
      icon: IconTrash,
      confirm: true
    };
  }

  protected onClick(): void {
    const { actions, blockManager } = this.editor;
    blockManager.removeBlock();
    actions.hide();
  }
}
