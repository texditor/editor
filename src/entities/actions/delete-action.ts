import type { ActionModelConfig } from "@/types";
import { IconTrash } from "@/icons";
import ActionModel from "@/core/models/action-model";

/** Delete a block */
export default class DeleteAction
  extends ActionModel
   {

  protected configure(): Partial<ActionModelConfig> {
    return {
      name: 'deleteAction',
      translation: 'deleteAction',
      icon: IconTrash,
      confirm: true
    };
  }

  protected onClick(): void {
    const { blockManager } = this.editor;
    blockManager.removeBlock();
  }
}
