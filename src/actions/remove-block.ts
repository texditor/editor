import { IconTrash } from "@/icons";
import ActionModel from "@/core/models/action-model";

export default class RemoveBlockAction extends ActionModel {
  protected name: string = "deleteBlock";
  protected tranlation: string = "deleteBlock";
  protected confirm: boolean = true;
  protected icon: string = IconTrash;

  onClick() {
    const { actions, blockManager, events } = this.editor;
    blockManager.removeBlock();
    actions.hide();
    events.refresh();
  }
}
