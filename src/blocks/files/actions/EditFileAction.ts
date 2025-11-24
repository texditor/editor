import { IconPencil } from "@/icons";
import type { FileActionModelInterface } from "@/types";
import FileActionModel from "@/core/models/file-action-model";
import { addClass, append, attr, closest, css, make } from "@/utils/dom";
import { off, on } from "@/utils/events";
import { isEmptyString } from "@/utils/string";

export default class EditFileAction extends FileActionModel implements FileActionModelInterface {
  name: string = "edit";
  prepare: boolean = true;
  protected icon: string = IconPencil;

  onClick() {}

  protected render(): HTMLElement | null {
    const block = this.getCurrentBlock(),
      uniqueId = this.getId(),
      item = this.getItem();

    return make("div", (editWrap: HTMLDivElement) => {
      const closePopup = () => block.removeChild(editWrap);

      off(document, "click.clfp" + uniqueId);
      on(
        document,
        "click.clfp" + uniqueId,
        (evt) => {
          if (closest(editWrap, evt.target)) {
            off(document, "click.clfp");
            closePopup();
          }
        },
        true
      );

      addClass(editWrap, "tex-files-item-edit tex-animate-fadeIn");
      append(
        editWrap,
        make("div", (editContent: HTMLDivElement) => {
          addClass(editContent, "tex-files-item-edit-content");
          append(editContent, this.renderEditItem(item));
          const reposition = () => {
            setTimeout(() => {
              if (block.offsetHeight < editContent.offsetHeight + item.offsetTop) {
                css(editContent, "top", block.offsetHeight - editContent.offsetHeight - 48);
              } else {
                css(editContent, "top", item.offsetTop - 24);
              }
            }, 1);
          };
          off(window, "resize.actEdit" + uniqueId);
          on(window, "resize.actEdit" + uniqueId, reposition);
          reposition();
        })
      );
    });
  }

  protected renderEditItem(item: HTMLElement) {
    const { events, i18n } = this.editor;

    return make("div", (el: HTMLElement) => {
      addClass(el, "tex-files-item-edit-popup");

      const captionImput = make("input", (input: HTMLInputElement) => {
          input.type = "text";
          input.value = item.dataset.caption || "";
          attr(input, "placeholder", i18n.get("caption", "Caption"));
          addClass(input, "tex-input tex-files-input");
        }) as HTMLInputElement,
        descInput = make("input", (input: HTMLInputElement) => {
          input.type = "text";
          input.value = item.dataset.desc || "";
          attr(input, "placeholder", i18n.get("desc", "Description"));
          addClass(input, "tex-input tex-files-input");
        }) as HTMLInputElement;

      append(el, [
        make("div", (div: HTMLDivElement) => {
          addClass(div, "tex-files-item-edit-popup-h");
          div.textContent = i18n.get("edit", "Edit");
        }),
        captionImput,
        descInput,
        make("div", (div: HTMLDivElement) => {
          addClass(div, "tex-files-item-edit-popup-btns");
          append(div, [
            make("button", (btn: HTMLButtonElement) => {
              btn.type = "button";
              addClass(btn, "tex-btn tex-btn-primary tex-btn-radius tex-btn-padding");
              btn.textContent = i18n.get("save", "Save");
              on(btn, "click.sv", () => {
                document.body.click();
                const captionValue = captionImput?.value || "",
                  descValue = descInput?.value || "";

                if (!isEmptyString(captionValue)) item.dataset.caption = captionValue;

                if (!isEmptyString(descValue)) item.dataset.desc = descValue;

                events.change({
                  type: "changeFileItem",
                  block: this.getElement(),
                  item: item
                });
              });
            }),
            make("button", (btn: HTMLButtonElement) => {
              btn.type = "button";
              addClass(btn, "tex-btn tex-btn-secondary tex-btn-radius tex-btn-padding");
              btn.textContent = i18n.get("сancel", "Сancel");
              on(btn, "click.cn", () => {
                document.body.click();
              });
            })
          ]);
        })
      ]);
    });
  }
}
