import ExtensionModel from "@/core/models/extension-model";
import { IconCheck, IconTrash } from "@/icons";
import { addClass, append, attr, css, make, removeClass } from "@/utils/dom";
import "@/styles/extensions/selection-mode.css";
import { HTMLBlockElement } from "@/types/core";
import renderIcon from "@/utils/renderIcon";
import { off, on } from "@/utils/events";

export default class SelectionMode extends ExtensionModel {
  name: string = "selectionMode";
  translation: string = "select";
  icon: string = IconCheck;
  toggleActive: boolean = true;
  protected groupName: string = "selectionMode";

  onClick(evt: Event & { el: EventTarget }): void {
    const { blockManager } = this.editor;
    evt.preventDefault();
    if (this.isActive()) {
      blockManager.disableSelectionMode();
    } else {
      blockManager.enableSelectionMode();
    }
  }

  isActive(): boolean {
    return this.editor.blockManager.isSelectionModeActive() || false;
  }

  create(): HTMLElement {
    const { api, blockManager, config, i18n } = this.editor;
    const created = super.create(),
      cssExtName = api.css("extension", false),
      cssName = cssExtName + "-" + this.getName();

    const wrap = make("div", (el: HTMLElement) => {
      addClass(el, cssName + "-wrap");
      append(el, created);
      append(
        el,
        make("div", (act: HTMLElement) => {
          addClass(act, cssName + "-actions");
          this.editor.events.add("selectionChanged.extSelectionMode", (blocks: HTMLBlockElement[]) => {
            css(act, "display", blocks.length > 0 ? "flex" : "");
          });
          append(
            act,
            make("div", (del: HTMLElement) => {
              off(del, "click.smDel");
              on(del, "click.smDel", () => blockManager.deleteSelectedBlocks());
              addClass(del, cssName + "-action-delete");
              append(
                del,
                make("span", (span: HTMLSpanElement) => {
                  span.innerHTML = renderIcon(IconTrash, { width: 14, height: 14 });
                })
              );

              const title = i18n.get("delete");

              attr(del, "title", title);

              if (config.get("extensionVisibleTitle", false))
                append(
                  del,
                  make("span", (span: HTMLSpanElement) => (span.innerHTML = title))
                );
            })
          );
        })
      );
    });

    this.editor.events.add("selectionModeDisabled.extSelectionMode", () => {
      removeClass(created, cssExtName + "-active");
    });

    return wrap;
  }
}
