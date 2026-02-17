import { BlockModelInterface, FileActionModelInstanceInterface, FileActionModelInterface } from "@/types/core/models";
import { FilesCreateOptions, FileItem } from "@/types/blocks";
import BlockModel from "@/core/models/block-model";
import "@/styles/blocks/files.css";
import { OutputBlockItem } from "@/types/output";
import { addClass, append, attr, closest, css, hasClass, html, make, prepend, query, queryLength } from "@/utils/dom";
import { HTMLBlockElement } from "@/types/core";
import { isEmptyString } from "@/utils/string";
import { decodeHtmlSpecialChars, encodeHtmlSpecialChars, formatBytes, generateRandomString } from "@/utils/common";
import { off, on } from "@/utils/events";
import { IconClose, IconFile, IconPlus } from "@/icons";
import { renderIcon } from "@/utils/icon";
import { AjaxOptions, fetchRequest, ProgressEvent } from "@priveted/ajax";
import { Response } from "@/types";
import MoveRightFileAction from "./actions/MoveRightFileAction";
import MoveLeftFileAction from "./actions/MoveLeftFileAction";
import DeleteFileAction from "./actions/DeleteFileAction";
import EditFileAction from "./actions/EditFileAction";
import DownloadFileAction from './actions/DownloadFileAction'

export {
  MoveRightFileAction,
  MoveLeftFileAction,
  DownloadFileAction,
  DeleteFileAction,
  EditFileAction
};

declare global {
  interface HTMLElement {
    fileSize?: number;
    fileName?: string;
    fileId?: number;
    thumbnail?: string;
  }
}

export default class Files extends BlockModel implements BlockModelInterface {
  private renderCallbacks: Record<string, CallableFunction> = {};

  configure() {
    const { i18n } = this.editor;

    return {
      autoParse: false,
      autoMerge: false,
      actions: [
        MoveLeftFileAction,
        EditFileAction,
        DownloadFileAction,
        DeleteFileAction,
        MoveRightFileAction
      ],
      icon: IconFile,
      itemIcon: IconFile,
      renderImage: true,
      backspaceRemove: false,
      isEnterCreate: false,
      tagName: "div",
      translationCode: "files",
      type: "files",
      editable: false,
      sanitizer: false,
      cssClasses: "tex-files",
      customSave: true,
      messageTimeout: 7000,
      mimeTypes: [],
      multiple: true,
      inputName: "files",
      responseMessageField: "message",
      responseMessageErrorField: "errors",
      listCss: "tex-files-list-c",
      fileCss: "tex-file",
      sourceWrapCss: "tex-file-source-c",
      uploadLabelIcon: renderIcon(IconPlus, {
        width: 12,
        height: 12
      }),
      uploadMultipleLabelText: i18n.get("uploadFiles", "Upload files"),
      uploadAddLabelText: i18n.get("addFiles", "Add files"),
      uploadLabelText: i18n.get("uploadFile", "Upload file"),
      uploadLabelMessage: "",
      showOnlyWhenEmpty: false,
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
    const allItems = items || [];

    return this.make("div", (el: HTMLBlockElement) => {
      append(el, this.form(allItems, el, options));
      append(el, this.createList(allItems, el, options || {}));
    });
  }

  __onRenderComplete__(): void {
    this.editor.events.trigger("file:actions:render:end");
  }

  protected onListCreate(items: FileItem[], block: HTMLBlockElement | null, options: FilesCreateOptions) {
    return {
      items: items,
      block: block,
      options: options
    };
  }

  protected defaultRenderItem(item: FileItem): HTMLElement {
    const itemIcon = this.getConfig('itemIcon', IconFile),
      isRenderImage = this.getConfig('renderImage', true),
      fileCss = this.getConfig('fileCss', 'tex-file');

    return make("div", (div: HTMLElement) => {
      const className = fileCss + '-layout',
        isImage = item.type.includes('image/');

      addClass(div, className);

      const layoutGrid = make('div', (lg: HTMLElement) => {
        addClass(lg, className + '-grid');

        const leftBlock = make("div", (lb: HTMLDivElement) => {
          addClass(lb, className + '-left');

          const iconWrap = make("div", (iconWrap: HTMLDivElement) => {
            addClass(iconWrap, className + '-icon-wrap');

            let iconHtml = renderIcon(itemIcon, {
              width: 16,
              height: 16
            });

            if (isImage && isRenderImage) {
              const imagePreview = make('img', (img: HTMLImageElement) => {
                addClass(img, className + "-img");
                img.src = item.url
              });

              iconHtml = imagePreview.outerHTML;
            }

            html(iconWrap, iconHtml);
          });

          const content = make("div", (cnt: HTMLDivElement) => {
            addClass(cnt, className + "-content");

            const name = make("div", (nameEl: HTMLDivElement) => {
              addClass(nameEl, className + '-name');

              if (item?.name) {
                nameEl.innerText = item?.name
              } else {
                const parts = item?.url.split(".");
                nameEl.innerText = "." + (parts.pop() || "");
              }
            });

            const contentElements = [name];

            if (item?.caption) {
              const caption = make("div", (captionEl: HTMLDivElement) => {
                addClass(captionEl, className + '-caption tex-file-caption');
                html(captionEl, encodeHtmlSpecialChars(item.caption || ''));
              });

              contentElements.push(caption)
            }

            if (item?.desc) {
              const desc = make("div", (descEl: HTMLDivElement) => {
                addClass(descEl, className + '-desc tex-file-desc');
                html(descEl, encodeHtmlSpecialChars(item.desc || ''))
              });

              contentElements.push(desc)
            }

            append(cnt, contentElements);
          });

          append(lb, [iconWrap, content]);
        });

        const rightBlock = make("div", (rb: HTMLDivElement) => {
          addClass(rb, className + '-right');

          if (item?.size) {
            const size = make("div", (sizeEl: HTMLDivElement) => {
              addClass(sizeEl, className + '-size');
              html(sizeEl, formatBytes(item?.size || 0));
            });

            append(rb, size);
          }
        });

        append(lg, [leftBlock, rightBlock]);
      });

      append(div, layoutGrid);
    });
  }

  protected createList(items: FileItem[], block: HTMLBlockElement, options: FilesCreateOptions): HTMLElement {
    this.setRenderCallback("default", (item: FileItem) => this.defaultRenderItem(item));
    this.onListCreate(items, block, options);

    return make("div", (el: HTMLElement) => {
      addClass(el, 'tex-files-list-container');

      const list = make('div', (list: HTMLDivElement) => {
        addClass(list, "tex-files-list " + this.getConfig("listCss", "tex-files-list-c"));

        if (items && Array.isArray(items)) {
          const finalyItems: FileItem[] = [];

          items.forEach((item: FileItem) => {
            if (item?.url && item?.type) finalyItems.push(item);
          });

          finalyItems.forEach((item: FileItem) => {
            this.onCreateItemBefore(item, list);
            this.item(list, item, "after", block);
            this.onCreateItemAfter(item, list);
          });
        }
      })

      append(el, list);
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

  save(block: OutputBlockItem, blockElement?: HTMLElement): OutputBlockItem {
    const root = blockElement || this.getElement();
    block.data = [];
    block = this.onSaveBefore(block, root);

    if (root) {
      query(
        ".tex-file",
        (el: HTMLElement) => {
          const preparedItem = { url: el.dataset.url, type: el.dataset.type } as FileItem;
          if (el.dataset.caption) preparedItem.caption = el.dataset.caption;
          if (el.dataset.desc) preparedItem.desc = el.dataset.desc;
          if (el.fileName) preparedItem.name = el.fileName;
          if (el.fileSize) preparedItem.size = el.fileSize;
          if (el.fileId) preparedItem.id = el.fileId;
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
      label = document.getElementById("label-" + id),
      percentText = document.getElementById("percent-" + id);

    if (loader && progress && percentText && label) {
      if (css(loader, "display") === "none") css(loader, "display", "block");

      css(label, "visibility", "hidden");
      percentText.innerText = percent + "%";
      css(progress, "width", percent + "%");
    }
  }

  hideProgress(id: string | number) {
    const loader = document.getElementById("loader-" + id);

    if (loader) {
      css(loader, "display", "");
    }
  }

  getListElement(block?: HTMLBlockElement): HTMLElement | null {
    const blockElement = block || this.getElement();

    if (!block) return null;

    let list = null;

    query(".tex-files-list", (el: HTMLElement) => (list = el), blockElement);

    return list;
  }

  protected createLabel(length: number, id: string) {
    const isMultiple = this.getConfig("multiple", true),
      multipleLabelText = this.getConfig("uploadMultipleLabelText") as string,
      labelText = this.getConfig("uploadLabelText") as string,
      addLabelText = this.getConfig("uploadAddLabelText") as string,
      iconLabel = this.getConfig("uploadLabelIcon") as string;

    return make("label", (label: HTMLLabelElement) => {
      attr(label, "for", "file-" + id);
      addClass(label, "tex-files-form-label");
      label.id = "label-" + id;

      const labelCnt = make("div", (labelContainer: HTMLDivElement) => {
        addClass(labelContainer, "tex-files-form-label-container");
        const text = make(
          "span",
          (span: HTMLSpanElement) =>
            (span.innerHTML = isMultiple ? (length >= 1 ? addLabelText : multipleLabelText) : labelText)
        ),
          icon = make("span", (span: HTMLSpanElement) => (span.innerHTML = iconLabel));

        append(labelContainer, [icon, text]);
      });

      const uploadLabelMessage = this.getConfig("uploadLabelMessage", ""),
        showOnlyWhenEmpty = this.getConfig("showOnlyWhenEmpty", false),
        labelItems = [labelCnt];

      if (!isEmptyString(uploadLabelMessage)) {
        const labelMessage = make("div", (msg: HTMLDivElement) => {
          addClass(msg, "tex-files-form-label-message");
          msg.innerHTML = uploadLabelMessage;
        });

        if ((showOnlyWhenEmpty && !length) || !showOnlyWhenEmpty) {
          labelItems.push(labelMessage);
        }
      }

      append(label, labelItems);
    });
  }

  protected form(items: FileItem[], block: HTMLBlockElement, options?: FilesCreateOptions) {
    const mimeTypes = this.getConfig("mimeTypes", []) as string[],
      isMultiple = this.getConfig("multiple", true),
      id = generateRandomString(16),
      { i18n } = this.editor;

    return make("div", (el: HTMLElement) => {
      addClass(el, "tex-files-form");

      const form = make("div", (form: HTMLFormElement) => {
        const labelFile = this.createLabel(items.length || 0, id);
        const inputFile = make("input", (input: HTMLInputElement) => {
          attr(input, "type", "file");
          css(input, "display", "none");

          if (isMultiple) attr(input, "multiple", "multiple");

          input.id = "file-" + id;

          if (mimeTypes.length) attr(input, "accept", mimeTypes.join(", "));

          const onloaded = (error: boolean = false) => {
            setTimeout(() => {
              css(labelFile, "visibility", "");
              this.hideProgress(id);

              if (!error) {
                document.getElementById("label-" + id)?.remove();

                if (isMultiple) prepend(form, this.createLabel(this.getItem(0) ? 1 : 0, id));
                else form.remove();
              }
            }, 500);
          };

          on(input, "cancel.file", () => {
            const element = this.getElement();

            if (element) this.removeIsEmpty(element as HTMLBlockElement);
          });

          on(input, "change.file", () => {
            css(labelFile, "visibility", "hidden");
            this.ajax(
              input,
              (response: Response) => {
                if (response.success && Array.isArray(response.data) && response.data.length) {
                  const list = this.getListElement(block);

                  if (list) {
                    const items: FileItem[] = [];

                    response.data.forEach((item: Record<string, string | number>) => {
                      if (item?.url && item?.type) {
                        const fileItem = {
                          url: item?.url,
                          type: item?.type
                        } as FileItem;

                        if (item?.size) fileItem.size = item.size as number;
                        if (item?.id) fileItem.id = item.id as number;

                        items.push(fileItem);
                      }
                    });

                    items.forEach((item: FileItem) => {
                      this.item(list, item, "before", block);
                    });
                  }
                  this.createMessage(this.responseMessage(response, i18n.get("fileUploadSuccess")), "success");
                } else {
                  this.createMessage(this.responseMessage(response, i18n.get("fileUploadError"), true));
                }
                onloaded();
              },
              (event: ProgressEvent) => this.progress(id, event.percent || 0),
              () => onloaded(true)
            );
          });
        });

        addClass(form, "tex-files-form-uploader");
        append(form, [labelFile, inputFile, this.createLoader(id)]);
      });

      if (!(!isMultiple && items.length > 0)) {
        append(el, form);
      }

      this.onFormCreate(el, block, options);
    });
  }

  moveItem(item: HTMLElement, index: number): void {
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
        ".tex-file",
        (el: HTMLElement, i: number) => {
          if (typeof item === "number" && i === item) data = el;
          if (el === item) data = i;
        },
        block
      );
    }

    return data;
  }

  getItemsLength(): number {
    const block = this.getElement();

    if (!block) return 0;

    return queryLength(".tex-file", block);
  }

  private createActionBar(item: HTMLElement, container: HTMLElement, block: HTMLBlockElement): HTMLElement {
    const { api } = this.editor,
      uniqueId = api.getUniqueId();

    return make("div", (div: HTMLDivElement) => {
      addClass(div, "tex-files-actions");
      const actionsWrap = make("div", (wrap: HTMLDivElement) => {
        addClass(wrap, "tex-files-actions-wrap tex-animate-fadeIn");
        append(
          wrap,
          make("div", (fileActions: HTMLDivElement) => {
            addClass(fileActions, "tex-files-actions-list");

            const actionList = this.getConfig("actions");

            (actionList as FileActionModelInstanceInterface[]).forEach(
              (fileAction: FileActionModelInstanceInterface) => {
                const fileActionInstance = new fileAction(this.editor, item, container, block);
                append(fileActions, fileActionInstance.create());
              }
            );
          })
        );
      });

      const hideActions = () => {
        query(
          ".tex-files-actions",
          (actions: HTMLElement) => {
            css(actions, "display", "")
          },
          container
        )
      }

      const closeIcon = make(
        'div',
        (close: HTMLDivElement) => {
          addClass(close, 'tex-files-actions-close');
          html(
            close,
            renderIcon(IconClose, {
              width: 14,
              height: 14
            })
          );
          on(close, 'click.close', () => setTimeout(() => hideActions(), 5));
        }
      );

      append(div, [actionsWrap, closeIcon]);

      off(document, "click.cab");
      on(item, "click.cab", () => {
        query(
          ".tex-files-action",
          (actionElement: HTMLElement) => {
            if ("fileAction" in actionElement) {
              const fileAction = actionElement?.fileAction as FileActionModelInterface;
              fileAction?.refresh();
            }
          },
          container
        );

        hideActions();
        off(document, "click.cab" + +uniqueId);
        on(
          document,
          "click.cab" + uniqueId,
          (evt: MouseEvent) => {
            if (closest(item, evt.target)) hideActions();
          },
          true
        );
        css(div, "display", "block");
      });
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
        el.insertAdjacentElement("afterend", messageBlock);

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
    const fileCss = this.getConfig("fileCss", "tex-file")

    if (typeof methodName === "function") {
      const itemElement = make("div", (el: HTMLElement) => {
        addClass(el, fileCss);
        el.dataset.type = item.type;
        el.dataset.url = item.url;
        el.id = block.id + "-" + generateRandomString(12);

        if (item?.name) el.fileName = item.name;
        if (item?.size) el.fileSize = item.size;
        if (item?.id) el.fileId = item.id;
        if (item?.thumbnail) el.thumbnail = item.thumbnail;
        if (item.caption) el.dataset.caption = decodeHtmlSpecialChars(item.caption);
        if (item.desc) el.dataset.desc = decodeHtmlSpecialChars(item.desc);

        const wrapper = make("div", (wrap: HTMLElement) => {
          addClass(wrap, fileCss + "-wrapper");
          append(wrap, this.createActionBar(el, container, block));

          const source = make("div", (src: HTMLElement) => {
            const sourceElement = methodName(item, block, container);
            addClass(src, fileCss + "-source");
            append(src, sourceElement);
          });

          append(wrap, source);
        });

        append(el, wrapper);
      });

      if (insert === "before") prepend(container, itemElement);
      else append(container, itemElement);
    }
  }

  removeIsEmpty(block: HTMLBlockElement) {
    const { blockManager } = this.editor;
    const len = queryLength(".tex-file", block);

    if (!len) {
      const curIndex = blockManager.getIndex();
      blockManager.removeBlock();
      blockManager.focusByIndex(curIndex > 0 ? curIndex - 1 : 0);
    }
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
        { data } = userOptions || {};

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
        headers: userOptions?.headers ? { ...userOptions.headers } : {}
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
          const message = this.responseMessage(error?.response, error.message, true);
          this.createMessage(i18n.get("fileUploadError") + ": " + message);
          if (onError) onError(error);

          events.change({
            type: "upload",
            success: false,
            error: error
          });
        });
    }
  }

  private responseMessage(response?: Response, defaultMessage?: string, isError: boolean = false): string {
    const messageField = isError
      ? (this.getConfig("responseMessageErrorField", "message") as string)
      : (this.getConfig("responseMessageField", "message") as string);

    if (!response) {
      return defaultMessage || "";
    }

    let message: unknown;

    if (messageField in response) {
      message = response[messageField];
    } else if (
      response.data &&
      typeof response.data === "object" &&
      response.data !== null &&
      messageField in response.data
    ) {
      message = (response.data as Record<string, unknown>)[messageField];
    } else {
      for (const key in response) {
        if (key !== "data" && key !== "success" && typeof response[key] === "string") {
          message = response[key];
          break;
        }
      }

      if (!message && response.data && typeof response.data === "object") {
        for (const key in response.data) {
          if (typeof (response.data as Record<string, unknown>)[key] === "string") {
            message = (response.data as Record<string, unknown>)[key];
            break;
          }
        }
      }
    }

    return this.normalizeMessage(message, defaultMessage);
  }

  private normalizeMessage(message: unknown, defaultMessage?: string): string {
    if (typeof message === "string") {
      return message;
    }

    if (Array.isArray(message)) {
      return message
        .map((item) => this.normalizeMessage(item))
        .filter((msg) => msg)
        .join(" | ");
    }

    if (message !== null && message !== undefined) {
      return String(message);
    }

    return defaultMessage || "Unknown error";
  }

  destroy() {
    const { api } = this.editor,
      uniqueId = api.getUniqueId();

    off(document, "click.clfp" + uniqueId);
    off(document, "click.cab" + +uniqueId);
  }
}
