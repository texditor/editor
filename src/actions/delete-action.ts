import type { ActionModelInterface, RenderIconContent } from "@/types";
import { IconTrash } from "@/icons";
import ActionModel from "@/core/models/action-model";

export default class DeleteAction
  extends ActionModel
  implements ActionModelInterface
{
  name: string = "deleteAction";
  protected translation: string = "deleteAction";
  protected confirm: boolean = true;
  protected icon: RenderIconContent = IconTrash;

  onClick() {
    const { actions, blockManager, events } = this.editor;
    blockManager.removeBlock();
    actions.hide();
    events.refresh();
  }
}
