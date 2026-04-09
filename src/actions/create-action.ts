import type {
  ActionModelInterface,
  BlockModelSchema,
  ActionModelConfig
} from "@/types";
import { IconPlus } from "@/icons";
import ActionModel from "@/core/models/action-model";
import { addClass, append, html, make } from "@/utils/dom";
import { rebind } from "@/utils/events";
import { renderIcon } from "@/utils";

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

    const schemas = blockManager.getSchemas();

    schemas.forEach((schema: BlockModelSchema) => {
      const model = schema.model;
      const modelElement = make("div", (el: HTMLDivElement) => {
        addClass(el, "tex-actions-menu-item");
        const iconContent = model.getIcon();

        if (iconContent) {
          append(
            el, make(
              'span',
              (span: HTMLSpanElement) => html(
                span,
                renderIcon(iconContent, {
                  width: model.getIconWidth(),
                  height: model.getIconHeight()
                })
              )
            )
          );
        }

        append(el, make(
          'span',
          (span: HTMLSpanElement) => {
            html(
              span,
              model.getTranslation() || model.getName()
            )
          }
        ));

        rebind(el, "click.am", () => {
          blockManager.createBlock(
            model.getName()
          );
        });
      });

      items.push(modelElement);
    });

    return {
      title: i18n.get(
        this.getTranslation(),
        this.getName()
      ),
      items: items
    };
  }
}
