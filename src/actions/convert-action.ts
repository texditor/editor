import type {
  ActionModelInterface,
  BlockModelStructure,
  RenderIconContent
} from "@/types";
import { IconConvert } from "@/icons";
import ActionModel from "@/core/models/action-model";
import { addClass, append, html, make } from "@/utils/dom";
import { off, on } from "@/utils/events";

/** Convert a block */
export default class ConvertAction
  extends ActionModel
  implements ActionModelInterface {
  name: string = "convertAction";
  protected translation: string = "convert";
  protected icon: RenderIconContent = IconConvert;
  protected menu: boolean = true;

  menuConfig() {
    const { blockManager, i18n } = this.editor,
      items: HTMLElement[] = [];
    const blockModels = blockManager.getBlockModels();

    blockModels.forEach((modelStructure: BlockModelStructure) => {
      const curBlock = blockManager.getBlockNode(),
        model = modelStructure.model;

      if (
        model.isConvertible() &&
        curBlock?.blockModel.getType() !== model.getType()
      ) {
        const modelElement = make("div", (el: HTMLDivElement) => {
          addClass(el, "tex-actions-menu-item");
          const icon = model.getIcon(12, 12);

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

  isVisible() {
    const { blockManager } = this.editor,
      blockModels = blockManager.getBlockModels(),
      blockNode = blockManager.getBlockNode();

    const filtered = blockModels.filter(
      (item) =>
        item.model.isConvertible() &&
        blockNode?.blockModel.getType() !== item.model.getType()
    );

    return !!blockManager.getModel()?.isConvertible() && !!filtered.length;
  }
}
