import { BlockModelInterface } from "@/types/core/models";
import { FilesCreateOptions, FileItem } from "@/types/blocks";
import BlockModel from "@/core/models/block-model";
import "@/styles/blocks/files.css";
import { OutputBlockItem } from "@/types/output";
import {
  addClass,
  append,
  attr,
  closest,
  css,
  hasClass,
  make,
  prepend,
  query,
  queryLength,
  removeClass
} from "@/utils/dom";
import { HTMLBlockElement } from "@/types/core";
import { isEmptyString } from "@/utils/string";
import { decodeHtmlSpecialChars, generateRandomString } from "@/utils/common";
import { off, on } from "@/utils/events";
import { IconArrowLeft, IconArrowRight, IconFile, IconPencil, IconPlus, IconTrash } from "@/icons";
import renderIcon from "@/utils/renderIcon";
import { AjaxOptions, fetchRequest, ProgressEvent } from "@priveted/ajax";

declare global {
  interface HTMLElement {
    fileSize?: number;
    thumbnail?: string;
  }
}

export default abstract class Files extends BlockModel implements BlockModelInterface {
  private renderCallbacks: Record<string, CallableFunction> = {};

  configure() {
    const { i18n } = this.editor;

    return {
      autoParse: false,
      autoMerge: false,
      icon: IconFile,
      backspaceRemove: false,
      isEnterCreate: false,
      tagName: "div",
      translationCode: "files",
      type: "files",
      shortType: "f",
      editable: false,
      sanitizer: false,
      cssClasses: "tex-files",
      customSave: true,
      messageTimeout: 7000,
      mimeTypes: [],
      multiple: true,
      inputName: "files",
      listCss: "tex-files-list-c",
      itemCss: "tex-files-item-c",
      sourceWrapCss: "tex-files-item-source-c",
      uploadLabelIcon: renderIcon(IconPlus, {
        width: 12,
        height: 12
      }),
      uploadMultipleLabelText: i18n.get("uploadFiles", "Upload files"),
      uploadAddLabelText: i18n.get("addFiles", "Add files"),
      uploadLabelText: i18n.get("uploadFile", "Upload file"),
      ajaxConfig: {
        url: "",
        options: {}
      }
    };
  }

  onPaste(evt: Event, input: Element | null): void {
    if (input !== null && !hasClass(evt.target, "tex-input")) evt.preventDefault();
  }

  create(items: FileItem[], options?: FilesCreateOptions): HTMLBlockElement | HTMLElement {
    const allItems = items || [],
      isMultiple = this.getConfig("multiple", true),
      isHideForm = !isMultiple && allItems?.length >= 1;

    return this.make("div", (el: HTMLBlockElement) => {
      if (!isHideForm) append(el, this.form(allItems, el, options));

      append(el, this.createList(allItems, el, options || {}));
    });
  }

  protected onListCreate(items: FileItem[], block: HTMLBlockElement | null, options: FilesCreateOptions) {
    return {
      items: items,
      block: block,
      options: options
    };
  }

  protected defaultRenderItem(item: FileItem): HTMLElement {
    return make("div", (div: HTMLElement) => {
      addClass(div, "tex-files-default-item");
      const icon = make("span", (span: HTMLSpanElement) => {
        span.innerHTML = renderIcon(IconFile, {
          width: 20,
          height: 20
        });
      }),
        ext = make("span", (span: HTMLSpanElement) => {
          const parts = item?.url.split(".");
          span.innerText = "." + (parts.pop() || "");
        });

      append(div, [icon, ext]);
    });
  }

  protected createList(items: FileItem[], block: HTMLBlockElement, options: FilesCreateOptions): HTMLElement {
    this.setRenderCallback("default", (item: FileItem) => this.defaultRenderItem(item));
    this.onListCreate(items, block, options);

    return make("div", (el: HTMLElement) => {
      addClass(el, "tex-files-list " + this.getConfig("listCss", "tex-files-list-c"));

      if (items && Array.isArray(items)) {
        const finalyItems: FileItem[] = [];

        items.forEach((item: FileItem) => {
          if (item?.url && item?.type) finalyItems.push(item);
        });

        finalyItems.forEach((item: FileItem) => {
          this.onCreateItemBefore(item, el);
          this.item(el, item, "after", block);
          this.onCreateItemAfter(item, el);
        });
      }
    });
  }

  getRenderCallback(mimeType: string) {
    return this.renderCallbacks[mimeType] || this.renderCallbacks["default"];
  }

  setRenderCallback(mimeType: string | string[], callback: CallableFunction) {
    if (Array.isArray(mimeType)) {
      mimeType.forEach((mime: string) => {
        this.renderCallbacks[mime] = callback;
      });
    } else this.renderCallbacks[mimeType] = callback;
  }

  parse(item: OutputBlockItem) {
    const { data, ...options } = item;

    return this.create(data as FileItem[], options);
  }

  save(block: OutputBlockItem): OutputBlockItem {
    const root = this.getElement();
    block.data = [];
    block = this.onSaveBefore(block, root);

    if (root) {
      query(
        ".tex-files-item",
        (el: HTMLElement) => {
          const preparedItem = { url: el.dataset.url, type: el.dataset.type } as FileItem;
          if (el.dataset.caption) preparedItem.caption = el.dataset.caption;
          if (el.dataset.desc) preparedItem.desc = el.dataset.desc;
          if (el.fileSize) preparedItem.size = el.fileSize;
          if (el.thumbnail) preparedItem.thumbnail = el.thumbnail;

          const fileItem = this.onSaveItem(preparedItem, el);

          if (fileItem.url && fileItem.type) {
            (block?.data as FileItem[])?.push(fileItem);
          }
        },
        root
      );
    }

    block = this.onSaveAfter(block, root);

    return block;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected onSaveBefore(block: OutputBlockItem, blockElement: HTMLElement | HTMLBlockElement | null): OutputBlockItem {
    return block;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected onSaveAfter(block: OutputBlockItem, blockElement: HTMLElement | HTMLBlockElement | null): OutputBlockItem {
    return block;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected onSaveItem(item: FileItem, el: HTMLElement): FileItem {
    return item;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected onCreateItemBefore(item: FileItem, el: HTMLElement) {
    return item;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected onCreateItemAfter(item: FileItem, el: HTMLElement) {
    return item;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected onFormCreate(el: HTMLElement, block: HTMLBlockElement, options?: FilesCreateOptions): HTMLElement {
    return el;
  }

  private createLoader(id: string | number) {
    return make("div", (div: HTMLDivElement) => {
      div.id = "loader-" + id;
      addClass(div, "tex-files-form-loading");
      append(div, [
        make("div", (pro: HTMLDivElement) => {
          pro.id = "progress-" + id;
          addClass(pro, "tex-files-form-progress");
        }),
        make("div", (per: HTMLDivElement) => {
          per.id = "percent-" + id;
          addClass(per, "tex-files-form-loading-percent");
        })
      ]);
    });
  }

  private progress(id: string | number, percent: number) {
    const loader = document.getElementById("loader-" + id),
      progress = document.getElementById("progress-" + id),
      percentText = document.getElementById("percent-" + id);

    if (loader && progress && percentText) {
      if (css(loader, "display") === "none") css(loader, "display", "block");

      percentText.innerText = percent + "%";
      css(progress, "width", percent + "%");
    }
  }

  hideProgress(id: string | number) {
    const loader = document.getElementById("loader-" + id);
    if (loader) css(loader, "display", "");
  }

  getListElement(block?: HTMLBlockElement): HTMLElement | null {
    const blockElement = block || this.getElement();

    if (!block) return null;

    let list = null;

    query(".tex-files-list", (el: HTMLElement) => (list = el), blockElement);

    return list;
  }

  protected form(items: FileItem[], block: HTMLBlockElement, options?: FilesCreateOptions) {
    const mimeTypes = this.getConfig("mimeTypes", []) as string[],
      isMultiple = this.getConfig("multiple", true),
      multipleLabelText = this.getConfig("uploadMultipleLabelText") as string,
      labelText = this.getConfig("uploadLabelText") as string,
      addLabelText = this.getConfig("uploadAddLabelText") as string,
      iconLabel = this.getConfig("uploadLabelIcon") as string,
      id = generateRandomString(16),
      { i18n } = this.editor;

    return make("div", (el: HTMLElement) => {
      addClass(el, "tex-files-form");

      const labelFile = make("label", (label: HTMLLabelElement) => {
        attr(label, "for", "file-" + id);
        label.id = "label-" + id;
        const text = make(
          "span",
          (span: HTMLSpanElement) =>
            (span.innerHTML = isMultiple ? (items.length >= 1 ? addLabelText : multipleLabelText) : labelText)
        ),
          icon = make("span", (span: HTMLSpanElement) => (span.innerHTML = iconLabel));

        append(label, [icon, text]);
      }),
        inputFile = make("input", (input: HTMLInputElement) => {
          attr(input, "type", "file");
          css(input, "display", "none");

          if (isMultiple) attr(input, "multiple", "multiple");

          input.id = "file-" + id;

          if (mimeTypes.length) attr(input, "accept", mimeTypes.join(", "));

          const onloaded = () => {
            setTimeout(() => {
              css(labelFile, "visibility", "");
              this.hideProgress(id);
            }, 1000);
          };

          on(input, "cancel.file", () => {
            const element = this.getElement();

            if (element) this.removeIsEmpty(element as HTMLBlockElement);
          });
          on(input, "change.file", () => {
            css(labelFile, "visibility", "hidden");
            this.ajax(
              input,
              ({
                success,
                data,
                message
              }: {
                success: boolean;
                data: Record<string, string | number>[];
                message?: string;
              }) => {
                if (success && Array.isArray(data) && data.length) {
                  const list = this.getListElement(block);

                  if (list) {
                    const items: FileItem[] = [];

                    data.forEach((item: Record<string, string | number>) => {
                      if (item?.url && item?.type) {
                        const fileItem = {
                          url: item?.url,
                          type: item?.type
                        } as FileItem;

                        if (item?.size) fileItem.size = item.size as number;

                        items.push(fileItem);
                      }
                    });

                    items.forEach((item: FileItem) => {
                      this.item(list, item, "before", block);
                    });
                  }

                  this.createMessage(i18n.get("fileUploadSuccess"), "success");
                } else {
                  this.createMessage(message || i18n.get("fileUploadError"));
                }
                onloaded();
              },
              (event: ProgressEvent) => this.progress(id, event.percent || 0),
              () => onloaded()
            );
          });
        });

      const form = make("div", (form: HTMLFormElement) => {
        addClass(form, "tex-files-form-uploader");
        append(form, [labelFile, inputFile, this.createLoader(id)]);
      });

      append(el, form);

      this.onFormCreate(el, block, options);
    });
  }

  protected move(item: HTMLElement, index: number) {
    const block = this.getElement();

    if (block) {
      const moveItem = this.getItem(index) as HTMLElement,
        curIndex = this.getItem(item) as number;

      if (moveItem && item) {
        if (curIndex > index) item?.insertAdjacentElement("afterend", moveItem);
        else if (curIndex < index) {
          moveItem?.insertAdjacentElement("afterend", item);
        }
      }
    }
  }

  getItem(item: HTMLElement | number): HTMLElement | number | null {
    const block = this.getElement();
    let data: HTMLElement | number = 0;

    if (block) {
      query(
        ".tex-files-item",
        (el: HTMLElement, i: number) => {
          if (typeof item === "number" && i === item) data = el;
          if (el === item) data = i;
        },
        block
      );
    }

    return data;
  }

  private arrowsVisible(item: HTMLElement) {
    const block = this.getElement();

    if (block) {
      const length = queryLength(".tex-files-item", block);
      let moveLeftBtn,
        moveRightBtn,
        index = 0;

      query(
        ".tex-files-item",
        (el: HTMLElement, i: number) => {
          if (el === item) index = i;
        },
        block
      );

      query(".move-btn-left", (el: HTMLElement) => (moveLeftBtn = el), item);
      query(".move-btn-right", (el: HTMLElement) => (moveRightBtn = el), item);

      if (moveLeftBtn && moveRightBtn) {
        removeClass(moveLeftBtn, "unactive");
        removeClass(moveRightBtn, "unactive");

        if (!index) addClass(moveLeftBtn, "unactive");
        if (index + 1 >= length) addClass(moveRightBtn, "unactive");
      }
    }
  }

  private createActionBar(item: HTMLElement, container: HTMLElement, block: HTMLBlockElement): HTMLElement {
    const { events } = this.editor;

    return make("div", (div: HTMLDivElement) => {
      addClass(div, "tex-files-actions");
      const actionsWrap = make("div", (wrap: HTMLDivElement) => {
        addClass(wrap, "tex-files-actions-wrap tex-animate-fadeIn");
        append(
          wrap,
          make("div", (actionList: HTMLDivElement) => {
            addClass(actionList, "tex-files-actions-list");

            const newAction = (
              icon: string,
              onClick: CallableFunction,
              eventName: string = "",
              cssName: string = ""
            ) => {
              return make("div", (act: HTMLDivElement) => {
                addClass(act, "tex-files-action " + cssName);
                act.innerHTML = renderIcon(icon, {
                  width: 18,
                  height: 18
                });
                on(act, "click.action", () => {
                  onClick(act);
                  if (eventName) {
                    events.change({
                      type: eventName,
                      block: block,
                      item: item
                    });
                  }
                });
              });
            },
              deleteBtn = newAction(
                IconTrash,
                () => {
                  item.remove();
                  this.removeIsEmpty(block);
                },
                "deleteFileItem"
              ),
              editBtn = newAction(IconPencil, () => {
                container.insertAdjacentElement(
                  "beforebegin",
                  make("div", (editWrap: HTMLDivElement) => {
                    const closePopup = () => block.removeChild(editWrap);

                    off(document, "click.clfp");
                    on(
                      document,
                      "click.clfp",
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
                        off(window, "resize.actEdit");
                        on(window, "resize.actEdit", reposition);
                        reposition();
                      })
                    );
                  })
                );
              }),
              moveRightBtn = newAction(
                IconArrowRight,
                () => this.move(item, ((this.getItem(item) || 0) as number) + 1),
                "moveRightFileItem",
                "tex-files-item-moveRight move-btn move-btn-right"
              ),
              moveLeftBtn = newAction(
                IconArrowLeft,
                () => this.move(item, ((this.getItem(item) || 0) as number) - 1),
                "moveLeftFileItem",
                "tex-files-item-moveLeft move-btn move-btn-left"
              );

            append(actionList, [moveLeftBtn, editBtn, deleteBtn, moveRightBtn]);
          })
        );
      });

      append(div, actionsWrap);

      const hideActions = () =>
        query(".tex-files-actions", (actions: HTMLElement) => css(actions, "display", ""), container);

      off(document, "click.cab");
      on(item, "click.cab", () => {
        hideActions();
        off(document, "click.cab");
        on(
          document,
          "click.cab",
          (evt: MouseEvent) => {
            if (closest(item, evt.target)) hideActions();
          },
          true
        );
        css(div, "display", "block");
        this.arrowsVisible(item);
      });
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

  protected createMessage(message: string, status: string = "error") {
    const block = this.getElement(),
      id = "message-" + generateRandomString(10);

    const messageBlock = make("div", (msg: HTMLInputElement) => {
      addClass(msg, "tex-file-message tex-message tex-message-" + status);
      msg.innerHTML = message;
      msg.id = id;
    });

    query(
      ".tex-files-form",
      (el: HTMLElement) => {
        append(el, messageBlock);
        setTimeout(
          () => {
            const msgEl = document.getElementById(id);

            if (msgEl) msgEl.remove();
          },
          this.getConfig("messageTimeout") as number
        );
      },
      block
    );
  }

  protected item(
    container: HTMLElement,
    item: FileItem,
    insert: "before" | "after" = "after",
    block: HTMLBlockElement
  ) {
    const methodName = this.getRenderCallback(item.type);

    if (typeof methodName === "function") {
      const itemElement = make("div", (el: HTMLElement) => {
        addClass(el, "tex-files-item " + this.getConfig("itemCss", "tex-files-item-c"));
        el.dataset.type = item.type;
        el.dataset.url = item.url;

        if (item?.size) el.fileSize = item.size;

        if (item?.thumbnail) el.thumbnail = item.thumbnail;

        if (item.caption) el.dataset.caption = decodeHtmlSpecialChars(item.caption);
        if (item.desc) el.dataset.desc = decodeHtmlSpecialChars(item.desc);

        el.id = block.id + "-" + generateRandomString(12);
        append(el, this.createActionBar(el, container, block));

        const source = make("div", (src: HTMLElement) => {
          const sourceElement = methodName(item, block, container);
          addClass(src, "tex-files-item-source " + this.getConfig("sourceWrapCss", "tex-files-item-source-c"));
          append(src, sourceElement);
        });

        append(el, source);
      });

      if (insert === "before") prepend(container, itemElement);
      else append(container, itemElement);
    }
  }

  private removeIsEmpty(block: HTMLBlockElement) {
    const len = queryLength(".tex-files-item", block);

    if (!len) block.remove();
  }

  ajax(
    input: HTMLInputElement,
    callback: CallableFunction,
    onUploadCallback: CallableFunction,
    onError?: CallableFunction
  ) {
    const { events, i18n } = this.editor;
    const ajaxConfig = this.getConfig("ajaxConfig") as {
      url: string;
      options: AjaxOptions;
    },
      inputName = this.getConfig("inputName", "files");

    if (isEmptyString(ajaxConfig?.url || "")) {
      this.createMessage(i18n.get("emptyUrl"));
      return;
    }

    const userOptions = ajaxConfig.options;

    if (input.files && input.files.length > 0) {
      const allowedTypes = this.getConfig("mimeTypes", []) as string[];
      const files = Array.from(input.files);

      for (const file of files) {
        const isValid = allowedTypes.some((pattern: string) => {
          if (pattern === "*/*") return true;
          if (pattern.endsWith("/*")) {
            return file.type.startsWith(pattern.split("/")[0] + "/");
          }
          return file.type === pattern;
        });

        if (!isValid) {
          this.createMessage(i18n.get("invalidFileType") + ": " + file.name);
          if (onError) onError(new Error("Invalid file type"));
          return;
        }
      }

      const formData = new FormData(),
        { data } = userOptions;

      if (
        data &&
        typeof data === "object" &&
        !(data instanceof FormData) &&
        !(data instanceof Blob) &&
        !(data instanceof ArrayBuffer) &&
        !(data instanceof URLSearchParams) &&
        !Array.isArray(data)
      ) {
        const dataObj = data as Record<string, unknown>;

        for (const item in dataObj) {
          if (Object.prototype.hasOwnProperty.call(dataObj, item)) {
            const value = dataObj[item];
            if (value !== undefined && value !== null) {
              formData.append(item, String(value));
            }
          }
        }
      }

      for (let i = 0; i < files.length; i++) {
        formData.append(inputName + "[]", files[i]);
      }

      const requestOptions: AjaxOptions = {
        method: "POST",
        data: formData,
        onUploadProgress: (progressEvent: ProgressEvent) => {
          if (onUploadCallback) onUploadCallback(progressEvent);
        },
        headers: userOptions.headers ? { ...userOptions.headers } : {}
      };

      fetchRequest(ajaxConfig.url, requestOptions)
        .then((response) => {
          callback(response);
          events.change({
            type: "upload",
            success: true,
            response: response
          });
        })
        .catch((error) => {
          this.createMessage(i18n.get("fileUploadError") + ": " + error.message);
          if (onError) onError(error);

          events.change({
            type: "upload",
            success: false,
            error: error
          });
        });
    }
  }
}
