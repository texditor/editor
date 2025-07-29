import { IconTrash } from "@/icons";
import ActionModel from "@/core/models/action-model";

export default class DeleteAction extends ActionModel {
  protected name: string = "deleteBlock";
  protected tranlation: string = "deleteBlock";
  protected confirm: boolean = true;
  protected icon: string = IconTrash;

  onClick() {
    const { actions, blockManager, config, events, selectionApi } = this.editor;

    const curIndex = blockManager.removeBlock(),
      defBlock = config.get("defaultBlock", "p");

    if (curIndex !== null) {
      const prevIndex = curIndex - 1,
        prevElem = blockManager.getByIndex(prevIndex);

      if (curIndex <= 0) {
        blockManager.focusByIndex(0);
      } else {
        if (prevElem) {
          const prevTextLength = prevElem?.textContent?.length || 0;
          prevElem.focus();
          selectionApi.select(prevTextLength, prevTextLength, prevElem);
        }
      }
    }

    if (blockManager.count() == 0) blockManager.createBlock(defBlock, -1);

    actions.hide();
    events.change({
      type: "delete",
      index: curIndex || 0
    });
    events.refresh();
  }
}
