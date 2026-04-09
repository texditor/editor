import type {
  ActionModelConfig,
  ActionModelInterface,
  BlockModelSchema
} from "@/types";
import { IconConvert } from "@/icons";
import ActionModel from "@/core/models/action-model";
import { addClass, append, html, make } from "@/utils/dom";
import { rebind } from "@/utils/events";
import { renderIcon } from "@/utils";

/** Convert a block */
export default class ConvertAction
  extends ActionModel
  implements ActionModelInterface {
  protected configure(): Partial<ActionModelConfig> {
    return {
      name: 'convertAction',
      icon: IconConvert,
      translation: 'convert',
      menu: true
    }
  }

  menuConfig() {
    const { blockManager, i18n } = this.editor,
      items: HTMLElement[] = [];
    const schemas = blockManager.getSchemas();

    schemas.forEach((schema: BlockModelSchema) => {
      const curBlock = blockManager.getNode(),
        model = schema.model;

      if (
        model.isConvertible() &&
        curBlock?.baseModel.getName() !== model.getName()
      ) {
        const modelElement = make("div", (el: HTMLDivElement) => {
          addClass(el, "tex-actions-menu-item");
          const iconContent = model.getIcon();

          if (iconContent) {
            append(el, make(
              'span',
              (span: HTMLSpanElement) => html(
                span,
                renderIcon(iconContent, {
                  width: model.getIconWidth(),
                  height: model.getIconHeight()
                })
              )
            ))
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
            if (curBlock) blockManager.convert(curBlock, model);
          });
        });

        items.push(modelElement);
      }
    });

    return {
      title: i18n.get(this.getTranslation(), this.getName()),
      items: items
    };
  }

  isVisible(): boolean {
    const { blockManager } = this.editor,
      schemas = blockManager.getSchemas(),
      blockNode = blockManager.getNode();

    const filtered = schemas.filter(
      (schema) =>
        schema.model.isConvertible() &&
        blockNode?.baseModel.getName() !== schema.model.getName()
    );

    return !!blockManager.getModel()?.isConvertible() && !!filtered.length;
  }
}
