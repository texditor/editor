import { IconTrash } from "@/icons";
import ActionModel from "@/core/models/action-model";
import { ActionModelInterface } from "@/types";

export default class DeleteAction extends ActionModel implements ActionModelInterface {
  name: string = "deleteAction";
  protected translation: string = "deleteAction";
  protected confirm: boolean = true;
  protected icon: string = IconTrash;

  onClick() {
    const { actions, blockManager, events } = this.editor;
    blockManager.removeBlock();
    actions.hide();
    events.refresh();
  }
}
