import type {
  ActionModelInterface,
  BlockModelStructure,
  ActionModelConfig
} from "@/types";
import { IconPlus } from "@/icons";
import ActionModel from "@/core/models/action-model";
import { addClass, append, html, make } from "@/utils/dom";
import { rebind } from "@/utils/events";
import BlockModel from "@/core/models/block-model";

/** Create a block */
export default class CreateAction
  extends ActionModel
  implements ActionModelInterface {
  protected configure(): Partial<ActionModelConfig> {
    return {
      name: 'createAction',
      translation: 'createAction',
      icon: IconPlus,
      menu: true
    }
  }

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

        rebind(el, "click.am", () => {
          const model = modelStructure.model as BlockModel;
          blockManager.createBlock(model.getType());
        });
      });

      items.push(modelElement);
    });

    return {
      title: i18n.get(this.getTranslation(), this.getName()),
      items: items
    };
  }
}
