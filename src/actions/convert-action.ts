import { IconConvert } from "@/icons";
import ActionModel from "@/core/models/action-model";
import { addClass, make } from "@/utils/dom";
import { off, on } from "@/utils/events";
import { BlockModelInterface, BlockModelStructure } from "@/types/core/models";

export default class ConvertAction extends ActionModel {
  protected name: string = "convertAction";
  protected translation: string = "convert";
  protected icon: string = IconConvert;
  protected menu: boolean = true;

  protected menuConfig() {
    const { api, blockManager, i18n } = this.editor,
      items: HTMLElement[] = [];
    const blockModels = api.getModels();

    blockModels.forEach((modelStructure: BlockModelStructure) => {
      const curBlock = blockManager.getCurrentBlock(),
        model = modelStructure.model as BlockModelInterface;

      if (model.isConvertible() && curBlock?.blockModel.getType() !== model.getType()) {
        const modelElement = make("div", (el: HTMLDivElement) => {
          addClass(el, "tex-actions-menu-item");
          const icon = model.getIcon(12, 12);

          if (icon) el.innerHTML = "<span>" + icon + "</span>";

          el.innerHTML += "<span>" + (modelStructure?.translation || "") + "</span>";

          off(el, "click.am");
          on(el, "click.am", () => {
            if (curBlock) blockManager.convert(curBlock, model);
          });
        });

        items.push(modelElement);
      }
    });

    return {
      title: i18n.get(this.translation, this.name),
      items: items
    };
  }

  protected isVisible() {
    return !!this.editor.blockManager.getModel()?.isConvertible();
  }
}
