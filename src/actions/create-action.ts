import type {
  RenderIconContent,
  ActionModelInterface,
  BlockModelStructure
} from "@/types";
import { IconPlus } from "@/icons";
import ActionModel from "@/core/models/action-model";
import { addClass, make } from "@/utils/dom";
import { off, on } from "@/utils/events";
import BlockModel from "@/core/models/block-model";

export default class CreateAction extends ActionModel implements ActionModelInterface {
  name: string = "createAction";
  protected translation: string = "createAction";
  protected icon: RenderIconContent = IconPlus;
  protected menu: boolean = true;

  menuConfig() {
    const { blockManager, events, i18n } = this.editor,
      items: HTMLElement[] = [];
    const blockModels = blockManager.getBlockModels();

    blockModels.forEach((modelStructure: BlockModelStructure) => {
      const modelElement = make("div", (el: HTMLDivElement) => {
        addClass(el, "tex-actions-menu-item");
        const icon = modelStructure.model.getIcon(12, 12);

        if (icon) el.innerHTML = "<span>" + icon + "</span>";

        el.innerHTML += "<span>" + (modelStructure?.translation || "") + "</span>";

        off(el, "click.am");
        on(el, "click.am", () => {
          const curBlock = blockManager.getCurrentBlock(),
            curIndex = blockManager.getIndex(),
            model = modelStructure.model as BlockModel;

          if (curBlock) {
            const block = model.create();

            if (block) {
              curBlock?.insertAdjacentElement("afterend", block);

              const blockElement = model.getElement(),
                isEditableChilds = model?.isEditableChilds();

              if (model?.isEditable() || isEditableChilds) {
                if (isEditableChilds) {
                  const editableChild = model.editableChild(block, true);

                  if (editableChild) {
                    (editableChild as HTMLElement)?.focus();
                  } else blockElement?.click();
                } else block.focus();
              } else {
                setTimeout(() => {
                  block.click();
                }, 10);
              }

              events.change({
                type: "createdBlock",
                index: curIndex,
                block: block
              });

              events.refresh();
            }
          }
        });
      });

      items.push(modelElement);
    });

    return {
      title: i18n.get(this.translation, this.name),
      items: items
    };
  }
}
