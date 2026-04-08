import type {
  BlockModelInterface,
  BlockModelConfig,
  BlockCreateOptions,
  BlockNode,
  FilesOnFormCreateParams,
  BlockOutput,
  FileItem,
  FileActionModelInterface,
  FileActionModelInstanceInterface,

} from "@/types";

import BlockModel from "@/core/models/block-model";
import { IconClose, IconFile, IconPlus } from "@/icons";
import { renderIcon } from "@/utils/icon";
// import MoveRightFileAction from "./actions/MoveRightFileAction";
// import MoveLeftFileAction from "./actions/MoveLeftFileAction";
// import DeleteFileAction from "./actions/DeleteFileAction";
// import EditFileAction from "./actions/EditFileAction";
// import DownloadFileAction from "./actions/DownloadFileAction";
import "@/styles/blocks/files.css";
import {
  addClass,
  append,
  attr,
  closest,
  css,
  decodeHtmlSpecialChars,
  generateRandomString,
  html,
  isEmptyString,
  make,
  on,
  prepend,
  query,
  rebind
} from "@/utils";

// export {
//   MoveRightFileAction,
//   MoveLeftFileAction,
//   DownloadFileAction,
//   DeleteFileAction,
//   EditFileAction
// };

declare global {
  interface HTMLElement {
    fileSize?: number;
    fileName?: string;
    fileId?: number;
    thumbnail?: string;
  }
}

export default class Filex extends BlockModel implements BlockModelInterface {
  private formNode: HTMLElement | null = null;
  private renderCallbacks: Record<string, CallableFunction> = {};

  protected configure(): Partial<BlockModelConfig> {
    const { i18n } = this.editor;

    return {
      autoParse: false,
      autoMerge: false,
      actions: [
        // MoveLeftFileAction,
        // EditFileAction,
        // DownloadFileAction,
        // DeleteFileAction,
        // MoveRightFileAction
      ],
      icon: IconFile,
      itemIcon: IconFile,
      renderImage: true,
      backspaceRemove: false,
      enterCreate: false,
      tagName: "div",
      translationCode: "files",
      type: "files",
      groupCode: 'files',
      editable: false,
      editableItems: false,
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

  protected create(options?: BlockCreateOptions): BlockNode {
    const blockNode = this.getBlockNode(),
      contentNode = this.getContentNode(),
      realOptions = options && Object.keys(options) && options.content
        ? options
        : { content: [] }

    css(contentNode, 'display', 'none');
    this.formNode = this.createForm(realOptions);
    prepend(blockNode, this.formNode);
    this.createList(realOptions);

    return blockNode;
  }

  getRenderCallback(mimeType: string) {
    return this.renderCallbacks[mimeType] || this.renderCallbacks["default"];
  }

  getFormNode(): HTMLElement | null {
    return this.formNode;
  }

  protected createForm(
    options: BlockCreateOptions
  ): HTMLElement {
    const isMultiple = this.getConfig("multiple", true),
      id = generateRandomString(16),
      itemsLength = options?.content?.length || 0;

    return make('div', (form: HTMLElement) => {
      addClass(form, "tex-files-form");

      const uploader = make('div', (uploaderEl: HTMLElement) => {
        addClass(form, "tex-files-form-uploader");
        const labelFile = this.formLabel(itemsLength, id);
        const inputFile = this.formInputFile(id, uploaderEl, labelFile);
        append(uploaderEl, [labelFile, inputFile]);
      })

      if (!(!isMultiple && itemsLength > 0))
        append(form, uploader);

      this.onFormCreate({
        form: form,
        options: options
      });
    })
  }

  protected formInputFile(
    id: string,
    uploaderElement: HTMLElement,
    labelFile: HTMLLabelElement
  ): HTMLInputElement {
    const mimeTypes = this.getConfig("mimeTypes", []) as string[],
      isMultiple = this.getConfig("multiple", true);

    return make("input", (input: HTMLInputElement) => {
      input.id = "file-" + id;
      attr(input, "type", "file");
      css(input, "display", "none");

      if (isMultiple)
        attr(input, "multiple", "multiple");

      if (mimeTypes.length)
        attr(input, "accept", mimeTypes.join(", "))

      // const onloaded = (error: boolean = false) => {
      //   setTimeout(() => {
      //     css(labelFile, "visibility", "");
      //     this.hideProgress(id);

      //     if (!error) {
      //       document.getElementById("label-" + id)?.remove();

      //       if (isMultiple)
      //         prepend(uploaderElement, this.formLabel(this.getItem(0) ? 1 : 0, id));
      //       else uploaderElement.remove();
      //     }
      //   }, 500);
      // };

    }) as HTMLInputElement;
  }

  protected formLabel(length: number, id: string): HTMLLabelElement {
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
          (span.innerHTML = isMultiple
            ? length >= 1
              ? addLabelText
              : multipleLabelText
            : labelText)
        ),
          icon = make(
            "span",
            (span: HTMLSpanElement) => (span.innerHTML = iconLabel)
          );

        append(labelContainer, [icon, text]);
      });

      const uploadLabelMessage = this.getConfig("uploadLabelMessage", ""),
        showOnlyWhenEmpty = this.getConfig("showOnlyWhenEmpty", false),
        labelItems = [labelCnt];

      if (!isEmptyString(uploadLabelMessage)) {
        const labelMessage = make("div", (msg: HTMLDivElement) => {
          addClass(msg, "tex-files-form-label-message");
          html(msg, uploadLabelMessage);
        });

        if ((showOnlyWhenEmpty && !length) || !showOnlyWhenEmpty) {
          labelItems.push(labelMessage);
        }
      }

      append(label, labelItems);
    }) as HTMLLabelElement;
  }

  protected onFormCreate(data: FilesOnFormCreateParams): FilesOnFormCreateParams {
    return data;
  }

  // List

  protected createList(
    options: BlockCreateOptions,
  ): HTMLElement {
    const contentNode = this.getContentNode(),
      items = options.content as FileItem[];

    addClass(contentNode, "tex-files-list " + this.getConfig("listCss"));

    if (items && Array.isArray(items)) {
      items.filter(
        (item) => item?.url && item?.type
      ).forEach((item: FileItem, index) => {
        // this.onCreateItemBefore(item, list);
        // this.item(list, item, "after", contentNode);
        console.log(this.createItem(item, index));
        // this.onCreateItemAfter(item, list);
      });


      css(contentNode, 'display', '');
    }

    this.onListCreate({
      options: options
    });

    return contentNode;
  }

  protected onListCreate(data: FilesOnFormCreateParams): FilesOnFormCreateParams {
    return data;
  }

  protected makeItemNode(item: FileItem): HTMLElement {
    const methodName = this.getRenderCallback(item.type),
      fileCss = this.getConfig("fileCss", "tex-file tex-item"),
      blockNode = this.getBlockNode();

    if (typeof methodName === "function" && blockNode) {
      return make("div", (el: HTMLElement) => {
        addClass(el, fileCss);
        el.dataset.type = item.type;
        el.dataset.url = item.url;
        el.id = blockNode.id + "-" + generateRandomString(12);

        if (item?.name) el.fileName = item.name;
        if (item?.size) el.fileSize = item.size;
        if (item?.id) el.fileId = item.id;
        if (item?.thumbnail) el.thumbnail = item.thumbnail;
        if (item.caption)
          el.dataset.caption = decodeHtmlSpecialChars(item.caption);
        if (item.desc) el.dataset.desc = decodeHtmlSpecialChars(item.desc);

        const wrapper = make("div", (wrap: HTMLElement) => {
          addClass(wrap, fileCss + "-wrapper");
          // append(wrap, this.createActionBar(el, container, blockNode));

          const source = make("div", (src: HTMLElement) => {
            const sourceElement = methodName(item, blockNode);
            addClass(src, fileCss + "-source");
            append(src, sourceElement);
          });

          append(wrap, source);
        });

        append(el, wrapper);
      });
    }

    return make('div');
  }


  private createActionBar(
    item: HTMLElement,
    container: HTMLElement,
    blockNode: BlockNode
  ): HTMLElement {
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
                const fileActionInstance = new fileAction(
                  this.editor,
                  item,
                  container,
                  blockNode
                );
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
            css(actions, "display", "");
          },
          container
        );
      };

      const closeIcon = make("div", (close: HTMLDivElement) => {
        addClass(close, "tex-files-actions-close");
        html(
          close,
          renderIcon(IconClose, {
            width: 14,
            height: 14
          })
        );
        on(close, "click.close", () => setTimeout(() => hideActions(), 5));
      });

      append(div, [actionsWrap, closeIcon]);
      rebind(item, "click.cab", () => {
        query(
          ".tex-files-action",
          (actionElement: HTMLElement) => {
            if ("fileAction" in actionElement) {
              const fileAction =
                actionElement?.fileAction as FileActionModelInterface;
              fileAction?.refresh();
            }
          },
          container
        );

        hideActions();
        rebind(
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

  // Loader
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

  protected parse(item: BlockOutput) {
    return this.create({ content: item.data });
  }

  protected onPaste(evt: Event): boolean {
    evt.preventDefault();
    return false;
  }
}
