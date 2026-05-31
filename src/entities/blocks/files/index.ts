import type {
  BlockElement,
  FileItem,
  BlockModelConstructor,
  FilesBlockModelConfig,
  FileItemElement,
  BlockSchema,
  AjaxConfig,
  AjaxOptions,
  FilesAjaxResponse,
  FileActionModelConstructor,
  FileActionModel,
  FilesBlockModel,
} from '@/types';
import { IconClose, IconFile, IconFiles, IconPlus } from '@/icons';
import BlockModel from '@/core/models/block-model';
import { renderIcon } from '@/utils/icon';
import MoveRightFileAction from './actions/MoveRightFileAction';
import MoveLeftFileAction from './actions/MoveLeftFileAction';
import DeleteFileAction from './actions/DeleteFileAction';
import EditFileAction from './actions/EditFileAction';
import DownloadFileAction from './actions/DownloadFileAction';
import '@/styles/entities/blocks/files.css';
import { ajax, executeMethodIfExists } from '@/utils';
import {
  addClass,
  append,
  attr,
  closest,
  css,
  decodeHtml,
  formatBytes,
  randString,
  html,
  isEmptyString,
  make,
  off,
  on,
  prepend,
  query,
  queryList,
  rebind,
  show,
} from 'snappykit';

export { MoveRightFileAction, MoveLeftFileAction, DownloadFileAction, DeleteFileAction, EditFileAction };

export default class Files extends BlockModel implements FilesBlockModel {
  /** Form container element */
  private formNode: HTMLElement | null = null;
  /** Upload progress bar element */
  private progressNode: HTMLElement | null = null;
  /** Counter displaying current/total items */
  private counterNode: HTMLElement | null = null;
  /** Custom render functions mapped by MIME type */
  private renderCallbacks: Record<string, CallableFunction> = {};

  private fileActions: FileActionModel[] = [];

  /** @see FilesBlockModel.setup */
  public static setup(config: Partial<FilesBlockModelConfig>): BlockModelConstructor {
    return super.setup(config);
  }

  /**
   * Configure block model
   * @returns Partial configuration object
   */
  protected configure(): Partial<FilesBlockModelConfig> {
    const { i18n } = this.editor;

    return {
      name: 'files',
      tagName: 'div',
      translation: 'files',
      groupCode: 'files',
      autoParse: false,
      autoMerge: false,
      actions: [MoveLeftFileAction, EditFileAction, DownloadFileAction, DeleteFileAction, MoveRightFileAction],
      icon: IconFile,
      renderImage: true,
      backspaceRemove: false,
      enterCreate: false,
      editable: false,
      sanitizer: false,
      className: 'tex-files',
      customSave: true,
      sortableItems: true,
      dragZoneClassName: 'tex-files-item-drag-zone',
      mimeTypes: [],
      multiple: true,
      maxItems: 10,
      visibleCounter: true,
      inputName: 'files',
      contentClassName: 'tex-files-content',
      itemClassName: 'tex-file-default',
      uploadLabelIcon: renderIcon(IconPlus, {
        width: 12,
        height: 12,
      }),
      uploadMultipleLabelText: i18n.get('uploadFiles', 'Upload files'),
      uploadAddLabelText: i18n.get('addFiles', 'Add files'),
      uploadLabelText: i18n.get('uploadFile', 'Upload file'),
      uploadLabelMessage: '',
      showOnlyWhenEmpty: false,
      requiredFieldFileName: true,
      requiredFieldCaption: false,
      requiredFieldDesc: false,
      visibleFieldFileName: true,
      visibleFieldCaption: true,
      visibleFieldDesc: true,
      ajaxConfig: { url: '' },
    };
  }

  /**
   * Hook called after model node creation
   * @param node - Created model node
   */
  protected onCreateElement(node: BlockElement): void {
    const contentElement = node.baseModel.getContentElement();

    if (contentElement) css(contentElement, 'display', 'none');
  }

  /**
   * Hook triggered after composition is complete
   */
  protected onCompose(): void {
    const blockElement = this.getElement();
    this.counterNode = this.createCounter();
    this.formNode = this.createForm();
    prepend(blockElement, this.formNode);
    this.createList();
    this.refresh();
  }

  /** @see FilesBlockModel.getRenderCallback */
  getRenderCallback(mimeType: string): CallableFunction {
    return this.renderCallbacks[mimeType] || this.renderCallbacks['default'];
  }

  /** @see FilesBlockModel.setRenderCallback */
  setRenderCallback(mimeType: string | string[], callback: CallableFunction): void {
    if (Array.isArray(mimeType)) {
      mimeType.forEach((mime: string) => {
        this.renderCallbacks[mime] = callback;
      });
    } else {
      this.renderCallbacks[mimeType] = callback;
    }
  }

  /**
   * Default render method for file items
   * @param item - File item data
   * @returns Rendered HTMLElement
   */
  protected defaultRenderItem(item: FileItem): HTMLElement {
    const isRenderImage = this.isRenderImage(),
      fileCss = 'tex-file';

    return make('div', (div: HTMLElement) => {
      const className = fileCss + '-layout',
        isImage = item.type.includes('image/');

      addClass(div, className);

      const layoutGrid = make('div', (lg: HTMLElement) => {
        addClass(lg, className + '-wrap');

        const leftBlock = make('div', (lb: HTMLDivElement) => {
          addClass(lb, className + '-left');

          const iconWrap = make('div', (iconWrap: HTMLDivElement) => {
            addClass(iconWrap, className + '-icon-wrap');

            let iconHtml = renderIcon(IconFile, {
              width: 16,
              height: 16,
            });

            if (isImage && isRenderImage) {
              const imagePreview = make('img', (img: HTMLImageElement) => {
                addClass(img, className + '-img');
                img.src = item.url;
              });

              iconHtml = imagePreview.outerHTML;
            }

            html(iconWrap, iconHtml);
          });

          const content = make('div', (cnt: HTMLDivElement) => {
            addClass(cnt, className + '-content');

            const name = make('div', (nameEl: HTMLDivElement) => {
              addClass(nameEl, 'tex-file-fileName');

              if (item?.name) {
                nameEl.innerText = item?.name;
              } else {
                const parts = item?.url.split('.');
                nameEl.innerText = '.' + (parts.pop() || '');
              }
            });

            const caption = make('div', (captionEl: HTMLDivElement) => {
              addClass(captionEl, 'tex-file-caption');
              captionEl.textContent = item.caption || '';
            });

            const desc = make('div', (descEl: HTMLDivElement) => {
              addClass(descEl, 'tex-file-desc');
              descEl.textContent = item.desc || '';
            });

            append(cnt, [name, caption, desc]);
          });

          append(lb, [iconWrap, content]);
        });

        const rightBlock = make('div', (rb: HTMLDivElement) => {
          addClass(rb, className + '-right');

          if (item?.size) {
            const size = make('div', (sizeEl: HTMLDivElement) => {
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

  /** @see FilesBlockModel.refresh */
  refresh(): void {
    const contentElement = this.getContentElement(),
      formNode = this.getFormNode(),
      itemsLength = this.getItemsLength(),
      maxItems = this.getMaxItems();

    if (!formNode) return;

    if (itemsLength > 0) css(contentElement, 'display', '');

    const [formUploader] = queryList<HTMLElement>('.tex-files-form-uploader', formNode);

    if (formUploader) {
      query(
        'input[type="file"]',
        (inputFile: HTMLInputElement) => {
          if (itemsLength >= maxItems || (!this.isMultiple() && itemsLength > 0)) {
            attr(inputFile, 'disabled', 'disabled');
          } else {
            inputFile.removeAttribute('disabled');
          }
        },
        formUploader,
      );

      this.refreshCount();
    }
  }

  /** @see FilesBlockModel.refreshCount */
  refreshCount(count?: number): void {
    const realCount = count || typeof count == 'number' ? count : this.getItemsLength();

    const counterNode = this.getCounterNode(),
      maxItems = this.getMaxItems();

    if (this.isMultiple() && counterNode) {
      const max = !maxItems ? '' : ' / ' + maxItems.toString();
      html(counterNode, '');
      append(counterNode, [
        make('span', (span: HTMLSpanElement) => {
          html(
            span,
            renderIcon(IconFiles, {
              width: 11,
              height: 11,
            }),
          );
        }),
        make('span', (span: HTMLSpanElement) => {
          span.textContent = realCount.toString() + max;
        }),
      ]);
    }
  }

  /**
   * Get the counter DOM element
   * @returns Counter element or null
   */
  /** @see FilesBlockModel.getCounterNode */
  getCounterNode(): HTMLElement | null {
    return this.counterNode;
  }

  /**
   * Create counter element for file count display
   * @returns Counter element
   */
  protected createCounter(): HTMLElement {
    return make('div', (el: HTMLDListElement) => {
      addClass(el, 'tex-files-counter');
    });
  }

  /** @see FilesBlockModel.getFormNode */
  getFormNode(): HTMLElement | null {
    return this.formNode;
  }

  /**
   * Create file upload form with input and label
   * @returns Form element
   */
  protected createForm(): HTMLElement {
    const id = randString(16),
      itemsLength = this.getOption('data', [])?.length || 0;

    return make('div', (form: HTMLElement) => {
      addClass(form, 'tex-files-form');

      const uploader = make('div', (uploaderEl: HTMLElement) => {
        addClass(uploaderEl, 'tex-files-form-uploader tex-no-select');
        const labelFile = this.formLabel(itemsLength, id);
        const inputFile = this.formInputFile(id);
        append(uploaderEl, [inputFile, labelFile]);
      });

      append(form, uploader);

      this.onFormCreate(form);
    });
  }

  /**
   * Handle file input cancel event
   * @param _evt - Base event object
   */
  protected onCancelFile(_evt: Event): void {
    const { blockManager } = this.editor;

    if (this.isEmpty()) blockManager.removeBlock();
  }

  /**
   * Handle file input change event, process upload
   * @param evt - Base event object with file input element
   */
  protected onChangeFile(evt: Event): void {
    const { i18n } = this.editor,
      input = evt.delegateTarget as HTMLInputElement,
      form = this.getFormNode();

    if (form) {
      const [label] = queryList<HTMLElement>('.tex-files-form-label', form);

      const onLoaded = () => {
        css(label, 'visibility', '');
        this.removeProgress();
        this.refresh();
      };

      if (label) {
        css(label, 'visibility', 'hidden');

        const maxItems = this.getMaxItems(),
          itemsLength = this.getItemsLength(),
          filesLength = input.files?.length || 0;

        if (itemsLength + filesLength > maxItems || (!this.isMultiple() && itemsLength > 0)) {
          this.toasts().add(i18n.get('fileUploadMaxItems'), { code: 'error' });
          onLoaded();
        } else {
          this.progress(0);
          this.ajax(
            input,
            (response: FilesAjaxResponse) => {
              if (response.success && Array.isArray(response.data) && response.data.length) {
                response.data.forEach((item: FileItem) => {
                  if (item.url && item.type) {
                    this.createItem(item, 0, true);
                  }
                });

                this.toasts().add(response?.message || i18n.get('fileUploadSuccess'), { code: 'success' });
              } else {
                this.toasts().add(response?.message || i18n.get('fileUploadError'));
              }
              onLoaded();
            },
            (percent: number) => {
              this.progress(percent);
            },
            () => {
              onLoaded();
            },
          );
        }
      }
    }
  }

  /** @see FilesBlockModel.isVisibleCounter */
  isVisibleCounter(): boolean {
    return this.getConfig('visibleCounter', true);
  }

  /** @see FilesBlockModel.getMimeTypes */
  getMimeTypes(): string[] {
    return this.getConfig('mimeTypes', []) as string[];
  }

  /** @see FilesBlockModel.isMultiple */
  isMultiple(): boolean {
    return this.getConfig('multiple', true);
  }

  /** @see FilesBlockModel.getAjaxConfig */
  getAjaxConfig(): AjaxConfig {
    return this.getConfig('ajaxConfig', { url: '' }) as AjaxConfig;
  }

  /** @see FilesBlockModel.getInputName */
  getInputName(): string {
    return this.getConfig('inputName', 'files');
  }

  /** @see FilesBlockModel.isRequiredFieldName */
  isRequiredFieldFileName(): boolean {
    return this.getConfig('requiredFieldFileName', true);
  }

  /** @see FilesBlockModel.isRequiredFieldCaption */
  isRequiredFieldCaption(): boolean {
    return this.getConfig('requiredFieldCaption', true);
  }

  /** @see FilesBlockModel.isRequiredFieldDesc */
  isRequiredFieldDesc(): boolean {
    return this.getConfig('requiredFieldDesc', true);
  }

  /** @see FilesBlockModel.isVisibleFieldName */
  isVisibleFieldFileName(): boolean {
    return this.getConfig('visibleFieldFileName', true);
  }

  /** @see FilesBlockModel.isVisibleFieldCaption */
  isVisibleFieldCaption(): boolean {
    return this.getConfig('visibleFieldCaption', true);
  }

  /** @see FilesBlockModel.isVisibleFieldDesc */
  isVisibleFieldDesc(): boolean {
    return this.getConfig('visibleFieldDesc', true);
  }

  /** @see FilesBlockModel.isRenderImage */
  isRenderImage(): boolean {
    return this.getConfig('renderImage', true);
  }

  /** @see BlockModel.removeItem */
  removeItem(index?: number): boolean {
    const status = super.removeItem(index);
    this.refresh();
    return status;
  }

  /**
   * Create file input element
   * @param id - Unique identifier for input
   * @returns File input element
   */
  protected formInputFile(id: string): HTMLInputElement {
    const mimeTypes = this.getMimeTypes(),
      isMultiple = this.getConfig('multiple', true);

    return make('input', (input: HTMLInputElement) => {
      input.id = 'file-' + id;
      attr(input, 'type', 'file');
      css(input, 'display', 'none');

      if (isMultiple) attr(input, 'multiple', 'multiple');

      if (mimeTypes.length) attr(input, 'accept', mimeTypes.join(', '));

      on(input, 'cancel.file', (evt) => this.onCancelFile(evt));
      on(input, 'change.file', (evt) => this.onChangeFile(evt));
    }) as HTMLInputElement;
  }

  /**
   * Create form label element for file input
   * @param length - Current items count
   * @param id - Unique identifier
   * @returns Label element
   */
  protected formLabel(length: number, id: string): HTMLLabelElement {
    const isMultiple = this.getConfig('multiple', true),
      multipleLabelText = this.getConfig('uploadMultipleLabelText') as string,
      labelText = this.getConfig('uploadLabelText') as string,
      addLabelText = this.getConfig('uploadAddLabelText') as string,
      iconLabel = this.getConfig('uploadLabelIcon') as string;

    return make('label', (label: HTMLLabelElement) => {
      attr(label, 'for', 'file-' + id);
      addClass(label, 'tex-files-form-label');
      label.id = 'label-' + id;

      const labelCnt = make('div', (labelContainer: HTMLDivElement) => {
        addClass(labelContainer, 'tex-files-form-label-container');

        const text = make(
            'span',
            (span: HTMLSpanElement) =>
              (span.innerHTML = isMultiple ? (length >= 1 ? addLabelText : multipleLabelText) : labelText),
          ),
          icon = make('span', (span: HTMLSpanElement) => (span.innerHTML = iconLabel));

        append(labelContainer, [icon, text]);

        const counterNode = this.getCounterNode();

        if (counterNode && this.isVisibleCounter()) append(labelContainer, counterNode);
      });

      const uploadLabelMessage = this.getConfig('uploadLabelMessage', ''),
        showOnlyWhenEmpty = this.getConfig('showOnlyWhenEmpty', false),
        labelItems = [labelCnt];

      if (!isEmptyString(uploadLabelMessage)) {
        const labelMessage = make('div', (msg: HTMLDivElement) => {
          addClass(msg, 'tex-files-form-label-message');
          html(msg, uploadLabelMessage);
        });

        if ((showOnlyWhenEmpty && !length) || !showOnlyWhenEmpty) {
          labelItems.push(labelMessage);
        }
      }

      append(label, labelItems);
    }) as HTMLLabelElement;
  }

  /**
   * Hook called after form element creation
   * @param _form - Form element
   */
  protected onFormCreate(_form: HTMLElement): void {}

  /**
   * Create list of file items from stored data
   * @returns Content node element
   */
  protected createList(): HTMLElement {
    const contentElement = this.getContentElement(),
      items = this.getOption('data', []) as FileItem[];

    this.setRenderCallback('default', (item: FileItem) => this.defaultRenderItem(item));

    this.onCreateList(contentElement);

    if (items.length && Array.isArray(items)) {
      const maxItems = this.getMaxItems();

      let filtered = items.filter((item) => item?.url && item?.type);

      if (filtered.length > maxItems) filtered = filtered.slice(0, maxItems);

      filtered.forEach((item: FileItem, index) => this.createItem(item, index, true));

      show(contentElement);
    }

    this.onCreatedList(contentElement);

    return contentElement;
  }

  /**
   * Hook called before list element creation
   * @param _contentElement - Content node element
   */
  protected onCreateList(_contentElement: HTMLElement): void {}

  /**
   * Hook called after list element creation
   * @param _contentElement - Content node element
   */
  protected onCreatedList(_contentElement: HTMLElement): void {}

  /**
   * Create DOM node for a file item
   * @param item - File item data
   * @returns Item element
   */
  protected makeItemElement(item: FileItem): HTMLElement {
    const methodName = this.getRenderCallback(item.type),
      className = this.getItemClassName(),
      fileCss = 'tex-file',
      blockElement = this.getElement();

    let itemElement = make('div') as FileItemElement;

    if (typeof methodName === 'function' && blockElement) {
      itemElement = make('div', (el: FileItemElement) => {
        addClass(el, 'tex-item  ' + fileCss + ' ' + className);
        el.id = blockElement.id + '-' + randString(12);
        el.fileType = item.type;
        el.fileUrl = item.url;

        if (item?.name) el.fileName = item.name;
        if (item?.size) el.fileSize = item.size;
        if (item?.id) el.fileId = item.id;
        if (item?.thumbnail) el.thumbnail = item.thumbnail;
        if (item.caption) el.fileCaption = decodeHtml(item.caption);
        if (item.desc) el.fileDesc = decodeHtml(item.desc);

        const wrapper = make('div', (wrap: HTMLElement) => {
          const sourceElement = methodName(item, blockElement);
          addClass(wrap, 'tex-item-body ' + fileCss + '-wrapper');
          append(wrap, sourceElement);
        });

        append(el, wrapper);
      }) as FileItemElement;
    }

    this.createActions(itemElement);

    return itemElement;
  }

  /**
   * Create action buttons for a file item
   * @param itemElement - File item element
   */
  protected createActions(itemElement: FileItemElement): void {
    let actionsConstructors: FileActionModel[] = [];
    const { i18n } = this.editor;
    const cssName = 'tex-files-actions',
      eid = this.getEventId(),
      contentElement = this.getContentElement();

    const hideActions = () => {
      actionsConstructors.forEach((action) => {
        const node = action.getElement();
        action.destroy();
        node.remove();
      });

      actionsConstructors = [];
      query(
        '.' + cssName,
        (actions: HTMLElement) => {
          css(actions, 'display', '');
        },
        contentElement,
      );
    };

    const actionsNode = make('div', (div: HTMLDivElement) => {
      addClass(div, cssName);
      const actionsWrap = make('div', (wrap: HTMLDivElement) => {
        addClass(wrap, cssName + '-wrap tex-animate-fadeIn');
        append(
          wrap,
          make('div', (fileActions: HTMLDivElement) => {
            addClass(fileActions, cssName + '-list');
          }),
        );
      });

      const actionButtons = make('div', (buttons: HTMLDivElement) => {
        const btnClassName = 'tex-files-actions-btn';
        addClass(buttons, 'tex-files-actions-buttons');

        const closeIcon = make('div', (close: HTMLDivElement) => {
          addClass(close, btnClassName + ' ' + btnClassName + '-close');
          attr(close, 'title', i18n.get('close', 'Close'));
          html(
            close,
            renderIcon(IconClose, {
              width: 14,
              height: 14,
            }),
          );
          on(close, 'click.close', () => setTimeout(() => hideActions(), 5));
        });

        if (this.isSortableItems()) {
          const dragZone = this.makeItemDragZone();
          addClass(dragZone, btnClassName + ' ' + btnClassName + '-sort');
          attr(dragZone, 'title', i18n.get('move', 'Move'));
          append(buttons, dragZone);
        }

        append(buttons, closeIcon);
      });

      append(div, [actionsWrap, actionButtons]);
    });

    append(itemElement, actionsNode);

    const actionConstructors = this.getConfig('actions', []) as FileActionModelConstructor[],
      [actionsNodeList] = queryList<HTMLElement>('.' + cssName + '-list', itemElement);

    if (actionsNodeList) {
      actionConstructors.forEach((instance: FileActionModelConstructor) => {
        const action = new instance(this.editor);
        const fileActionElement = action.getElement();
        append(actionsNodeList, fileActionElement);
        executeMethodIfExists(action, '__onMount', [fileActionElement]);
        this.fileActions.push(action);
      });

      const reVisible = () => {
        this.getFileActions().forEach((action: FileActionModel) => {
          css(action.getElement(), 'display', action.isVisible() ? '' : 'none');
        });
      };

      reVisible();

      this.on('onChange.fileAction', () => reVisible());

      rebind(
        itemElement,
        'click.cab',
        () => {
          hideActions();
          css(actionsNode, 'display', 'block');

          on(
            document,
            'click.cab' + eid,
            (evt: MouseEvent) => {
              if (!closest(evt.target, itemElement)) {
                hideActions();
                off(document, 'click.cab' + eid, true);
              }
            },
            true,
          );
        },
        true,
      );
    }
  }

  /** @see FilesBlockModel.getFileActions */
  getFileActions(): FileActionModel[] {
    return this.fileActions;
  }

  /**
   * Create progress bar element for upload
   */
  protected createProgress(): void {
    const form = this.getFormNode();

    if (form && !this.progressNode) {
      this.progressNode = make('div', (div: HTMLDivElement) => {
        addClass(div, 'tex-files-form-progress');
        append(div, [
          make('div', (pro: HTMLDivElement) => {
            addClass(pro, 'tex-files-form-progress-line');
          }),
          make('div', (per: HTMLDivElement) => {
            addClass(per, 'tex-files-form-progress-percent');
          }),
        ]);
      });

      const [uploaderNode] = queryList<HTMLElement>('.tex-files-form-uploader', form);

      if (uploaderNode) {
        append(uploaderNode, this.progressNode);
      }
    }
  }

  /** @see FilesBlockModel.getProgressNode */
  getProgressNode(): HTMLElement | null {
    return this.progressNode;
  }

  /** @see FilesBlockModel.progress */
  progress(percent: number): void {
    this.createProgress();

    const progressNode = this.getProgressNode();
    const cssName = '.tex-files-form';

    if (progressNode) {
      query(cssName + '-progress-line', (el: HTMLDivElement) => css(el, 'width', percent + '%'), progressNode);
      query(cssName + '-progress-percent', (el: HTMLDivElement) => (el.innerText = percent + '%'), progressNode);
    }
  }

  /** @see FilesBlockModel.removeProgress */
  removeProgress(): void {
    const progressNode = this.getProgressNode();

    if (progressNode) {
      progressNode.remove();
      this.progressNode = null;
    }
  }

  /**
   * Perform AJAX file upload
   * @param input - File input element
   * @param success - Success callback
   * @param progress - Progress callback
   * @param error - Error callback
   */
  protected ajax(
    input: HTMLInputElement,
    success: CallableFunction,
    progress: CallableFunction,
    error?: CallableFunction,
  ): void {
    const { i18n } = this.editor;
    const ajaxConfig = this.getAjaxConfig(),
      inputName = this.getInputName();

    const url = ajaxConfig.url;

    if (isEmptyString(url)) {
      this.toasts().add(i18n.get('emptyUrl'));
      return;
    }

    const userOptions = ajaxConfig.options;

    if (input.files && input.files.length > 0) {
      const allowedTypes = this.getMimeTypes();
      const files = Array.from(input.files);

      if (allowedTypes.length) {
        for (const file of files) {
          const isValid = allowedTypes.some((pattern: string) => {
            if (pattern === '*/*') return true;
            if (pattern.endsWith('/*')) {
              return file.type.startsWith(pattern.split('/')[0] + '/');
            }
            return file.type === pattern;
          });

          if (!isValid) {
            this.toasts().add(i18n.get('invalidFileType') + ': ' + file.name);
            if (error) error(new Error('Invalid file type'));
            return;
          }
        }
      }

      const formData = new FormData(),
        { data } = userOptions || {};
      if (
        data &&
        typeof data === 'object' &&
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
        formData.append(inputName + '[]', files[i]);
      }

      const ajaxOptions: AjaxOptions = {
        method: userOptions?.method || 'POST',
        data: formData,
        progress: (percent: number, loaded: number, total: number) => {
          if (progress) progress(percent, loaded, total);

          if (userOptions?.progress) {
            userOptions.progress(percent, loaded, total);
          }
        },
        error: (errorData) => {
          if (error) error(errorData);

          if (userOptions?.error) {
            userOptions.error(errorData);
          }
        },
        headers: userOptions?.headers ? { ...userOptions.headers } : {},
        timeout: userOptions?.timeout || 45000,
      };

      ajax<FilesAjaxResponse>(url, ajaxOptions)
        .then((response) => {
          if (progress) success(response);

          if (userOptions?.success) {
            userOptions.success(response);
          }
          this.change(
            'upload',
            {
              success: true,
              response: response,
            },
            {
              uploadEvent: true,
            },
          );
        })
        .catch((errorData) => {
          this.toasts().add(i18n.get('fileUploadError') + ': ' + (errorData?.message || 'Unknown error'));

          if (error) error(errorData);

          if (userOptions?.error) {
            userOptions.error(errorData);
          }

          this.change(
            'upload',
            {
              success: false,
              error: error,
            },
            {
              uploadEvent: true,
            },
          );
        });
    }
  }

  /**
   * Saves block data to output format
   * @param blockSchema - Block schema
   * @param blockElement - Block element
   * @returns The modified block output.
   */
  protected save(blockSchema: BlockSchema, blockElement?: BlockElement): BlockSchema {
    const root = blockElement || this.getElement();
    blockSchema.data = [];

    if (root) {
      query(
        '.tex-file',
        (el: FileItemElement) => {
          const preparedItem = {
            url: el.fileUrl || '',
            type: el.fileType || '',
          } as FileItem;

          if (el?.fileCaption) preparedItem.caption = el.fileCaption;
          if (el?.fileDesc) preparedItem.desc = el?.fileDesc;
          if (el.fileName) preparedItem.name = el.fileName;
          if (el.fileSize) preparedItem.size = el.fileSize;
          if (el.fileId) preparedItem.id = el.fileId;
          if (el.thumbnail) preparedItem.thumbnail = el.thumbnail;

          const fileItem = preparedItem;

          if (fileItem.url && fileItem.type) {
            (blockSchema?.data as FileItem[])?.push(fileItem);
          }
        },
        root,
      );
    }
    return blockSchema;
  }

  /**
   * Handle paste event (disabled for files block)
   * @param _evt - Paste event
   * @returns Always false
   */
  protected onPaste(_evt: Event): boolean {
    return false;
  }

  /**
   * Clean up event listeners on destroy
   */
  destroy(): void {
    const eid = this.getEventId();
    off(document, 'click.cab' + eid);
  }
}
