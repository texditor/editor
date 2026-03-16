import type {
  RenderIconContent,
  ActionModelInterface,
  BlockModelStructure
} from "@/types";
import { IconPlus } from "@/icons";
import ActionModel from "@/core/models/action-model";
import { addClass, append, html, make } from "@/utils/dom";
import { off, on } from "@/utils/events";
import BlockModel from "@/core/models/block-model";

/** Create a block */
export default class CreateAction
  extends ActionModel
  implements ActionModelInterface {
  name: string = "createAction";
  protected translation: string = "createAction";
  protected icon: RenderIconContent = IconPlus;
  protected menu: boolean = true;

  menuConfig() {
    const { blockManager, i18n } = this.editor,
      items: HTMLElement[] = [];

    const blockModels = blockManager.getBlockModels();

    blockModels.forEach((modelStructure: BlockModelStructure) => {
      const modelElement = make("div", (el: HTMLDivElement) => {
        addClass(el, "tex-actions-menu-item");
        const icon = modelStructure.model.getIcon(12, 12);

        if (icon) {
          append(el, make(
            'span',
            (span: HTMLSpanElement) => html(span, icon)
          ))
        }

        append(el, make(
          'span',
          (span: HTMLSpanElement) => {
            html(
              span,
              (modelStructure?.translation || "")
            )
          }
        ));

        off(el, "click.am");
        on(el, "click.am", () => {
          const model = modelStructure.model as BlockModel;
          blockManager.createBlock(model.getType());
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
