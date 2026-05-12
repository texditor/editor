import type {
  ActionModelConfig,
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
   {
  protected configure(): Partial<ActionModelConfig> {
    return {
      name: 'convertAction',
      icon: IconConvert,
      translation: 'convert',
      dropdown: true
    }
  }
  protected dropdown(): HTMLElement {
    const { blockManager } = this.editor;
    const blockElement = this.getBlockElement(),
      schemas = blockManager.getSchemas();

    return make('div', (div: HTMLDivElement) => {
      const title = make('h4', (h4: HTMLHeadingElement) => {
        h4.textContent = this.getTranslation() || this.getName();
      })

      append(div, title);

      schemas.forEach((schema: BlockModelSchema) => {
        const model = schema.model;
        if (
          model.isConvertible() &&
          blockElement?.baseModel.getName() !== model.getName()
        ) {
          const modelElement = make("div", (el: HTMLDivElement) => {
            addClass(el, "tex-actions-content-dropdown-item");
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
              if (blockElement) blockManager.convert(blockElement, model);
            });
          });

          append(div, modelElement);
        }
      });
    });
  }

  isVisible(): boolean {
    const blockElement = this.getBlockElement();
    const model = blockElement?.baseModel;

    if (!model) return false;

    return model.isConvertible();
  }
}
