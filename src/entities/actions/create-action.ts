import type { BlockModelSchema, ActionModelConfig } from '@/types';
import { IconPlus } from '@/icons';
import ActionModel from '@/core/models/action-model';

import { addClass, append, html, make, rebind } from 'snappykit';

import { renderIcon } from '@/utils';

/** Create a block */
export default class CreateAction extends ActionModel {
  protected configure(): Partial<ActionModelConfig> {
    return {
      name: 'createAction',
      translation: 'createAction',
      icon: IconPlus,
      dropdown: true,
    };
  }

  protected dropdown(): HTMLElement {
    const { blockManager } = this.editor;
    const schemas = blockManager.getSchemas();

    return make('div', (div: HTMLDivElement) => {
      const title = make('h4', (h4: HTMLHeadingElement) => {
        h4.textContent = this.getTranslation() || this.getName();
      });

      append(div, title);

      schemas.forEach((schema: BlockModelSchema) => {
        const model = schema.model;
        const modelElement = make('div', (el: HTMLDivElement) => {
          addClass(el, 'tex-actions-content-dropdown-item');
          const iconContent = model.getIcon();

          if (iconContent) {
            append(
              el,
              make('span', (span: HTMLSpanElement) =>
                html(
                  span,
                  renderIcon(iconContent, {
                    width: model.getIconWidth(),
                    height: model.getIconHeight(),
                  }),
                ),
              ),
            );
          }

          append(
            el,
            make('span', (span: HTMLSpanElement) => {
              html(span, model.getTranslation() || model.getName());
            }),
          );

          rebind(el, 'click.am', () => {
            blockManager.createBlock(model.getName());
          });
        });

        append(div, modelElement);
      });
    });
  }
}
