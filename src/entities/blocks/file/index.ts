import type {
  BlockElement,
  FileItem,
  BlockModelConstructor,
  FileBlockModelConfig,
  FileItemElement,
  BlockSchema,
  AjaxConfig,
  AjaxOptions,
  FileAjaxResponse,
  FileActionModelConstructor,
  FileActionModel,
  FileBlockModel,
  FileResponseItem,
  FileAsyncResponse,
  AjaxResponse,
  FileAsyncCheckerResponse,
  FileAsyncCancelResponse,
  BlockSchemaData,
  GlobalFile,
  AjaxData,
  TexditorEventBase,
} from '@/types';
import { IconClose, IconFile, IconFolder, IconPlus } from '@/icons';
import BlockModel from '@/core/models/block-model';
import { renderIcon } from '@/utils/icon';
import MoveRightFileAction from './actions/MoveRightFileAction';
import MoveLeftFileAction from './actions/MoveLeftFileAction';
import DeleteFileAction from './actions/DeleteFileAction';
import EditFileAction from './actions/EditFileAction';
import DownloadFileAction from './actions/DownloadFileAction';
import '@/styles/entities/blocks/file.css';
import { ajax, executeMethodIfExists, generateUUID } from '@/utils';
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
  text,
} from 'snappykit';

export { MoveRightFileAction, MoveLeftFileAction, DownloadFileAction, DeleteFileAction, EditFileAction };

export default class File extends BlockModel implements FileBlockModel {
  /** Form container element */
  private formElement: HTMLElement | null = null;
  /** Upload progress bar element */
  private progressElement: HTMLElement | null = null;
  /** Counter displaying current/total items */
  private counterElement: HTMLElement | null = null;
  /** An array with actions */
  private fileActions: FileActionModel[] = [];
  /** Async timer ID for cancellation */
  private asyncTimerId: number | null = null;
  /** Current async task ID */
  private taskId: string | number = '';
  /** Current job status */
  private jobStatus: string = '';
  /** Set of active XHR requests for cancellation support */
  private activeXHRs: Set<XMLHttpRequest> = new Set();
  /** Current file index being uploaded */
  private currentFileIndex: number = 0;
  /** Total files to upload */
  private totalFilesCount: number = 0;

  /** @see FileBlockModel.setup */
  public static setup(config: Partial<FileBlockModelConfig>): BlockModelConstructor {
    return super.setup(config);
  }

  /**
   * Configure block model
   * @returns Partial configuration object
   */
  protected configure(): Partial<FileBlockModelConfig> {
    const { i18n } = this.editor;

    return {
      name: 'file',
      tagName: 'div',
      translation: 'files',
      groupCode: 'file',
      autoParse: false,
      autoMerge: false,
      actions: [MoveLeftFileAction, EditFileAction, DownloadFileAction, DeleteFileAction, MoveRightFileAction],
      icon: IconFile,
      renderImage: true,
      backspaceRemove: false,
      enterCreate: false,
      editable: false,
      sanitizer: false,
      className: 'tex-file',
      customSave: true,
      sortableItems: true,
      dragZoneClassName: 'tex-file-item-drag-zone',
      mimeTypes: [],
      multiple: true,
      maxItems: 10,
      visibleCounter: true,
      inputName: 'file',
      contentClassName: 'tex-file-content',
      itemClassName: 'tex-file-item-default',
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
      linkStrategy: false,
      ajaxConfig: { url: '' },
      asyncCheckerConfig: { url: '' },
      asyncCancelConfig: { url: '' },
      actionSkipSelector: '',
      chunked: false,
      chunkSize: 2 * 1024 * 1024,
      fileMaxSize: 10 * 1024 * 1024,
      retry: true,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      fileManager: false,
      fileManagerShowTitle: false,
      fileManagerTitle: i18n.get('fileManager', 'File Manager'),
      fileManagerBtnIcon: renderIcon(IconFolder, {
        width: 12,
        height: 12,
      }),
      fileManagerLtr: 'right',
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
    this.counterElement = this.createCounter();
    this.formElement = this.createForm();
    prepend(blockElement, this.formElement);
    this.createList();
    this.refresh();
  }

  /**
   * Block change event
   * @param _evt - Base event
   */
  protected onBlockChange(_evt?: TexditorEventBase): void {
    this.refresh();
  }

  /**
   * Default render method for file items
   * @param item - File item data
   * @returns Rendered HTMLElement
   */
  protected renderItem(item: FileItem, _el?: FileItemElement): HTMLElement {
    const isRenderImage = this.isRenderImage(),
      fileCss = 'tex-file-item';

    return make('div', (div: HTMLElement) => {
      const className = fileCss + '-layout',
        isImage = item.type?.includes('image/');

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
                img.src = item?.url || '';
              });

              iconHtml = imagePreview.outerHTML;
            }

            html(iconWrap, iconHtml);
          });

          const content = make('div', (cnt: HTMLDivElement) => {
            addClass(cnt, className + '-content');

            const name = make('div', (nameEl: HTMLDivElement) => {
              addClass(nameEl, 'tex-file-item-fileName');

              if (item?.realName || item?.name) {
                nameEl.innerText = item.realName || item.name || '';
              } else {
                const parts = (item?.url || '').split('.');
                nameEl.innerText = '.' + (parts.pop() || '');
              }
            });

            const caption = make('div', (captionEl: HTMLDivElement) => {
              addClass(captionEl, 'tex-file-item-caption');
              captionEl.textContent = item.caption || '';
            });

            const desc = make('div', (descEl: HTMLDivElement) => {
              addClass(descEl, 'tex-file-item-desc');
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

  /** @see FileBlockModel.refresh */
  refresh(): void {
    const contentElement = this.getContentElement(),
      formElement = this.getFormElement(),
      itemsLength = this.getItemsLength(),
      maxItems = this.getMaxItems();

    if (!formElement) return;

    if (itemsLength > 0) css(contentElement, 'display', '');

    const [formUploader] = queryList<HTMLElement>('.tex-file-form-uploader', formElement);
    const [fileManger] = queryList<HTMLElement>('.tex-file-form-fileManager', formElement);

    const checkDisabled = (selector: string, container: HTMLElement) => {
      query(
        selector,
        (inputFile: HTMLInputElement) => {
          if (itemsLength >= maxItems || (!this.isMultiple() && itemsLength > 0)) {
            attr(inputFile, 'disabled', 'disabled');
          } else {
            inputFile.removeAttribute('disabled');
          }
        },
        container,
      );
      this.refreshCount();
    };

    if (fileManger) checkDisabled('.tex-file-form-fileManager-btn', fileManger);

    if (formUploader) checkDisabled('input[type="file"]', formUploader);
  }

  /** @see FileBlockModel.refreshCount */
  refreshCount(count?: number): void {
    const realCount = count || typeof count == 'number' ? count : this.getItemsLength();

    const counterElement = this.getCounterElement(),
      maxItems = this.getMaxItems();

    if (this.isMultiple() && counterElement) {
      const max = !maxItems ? '' : ' / ' + maxItems.toString();
      html(counterElement, '');
      append(counterElement, [
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
  /** @see FileBlockModel.getCounterElement */
  getCounterElement(): HTMLElement | null {
    return this.counterElement;
  }

  /**
   * Create counter element for file count display
   * @returns Counter element
   */
  protected createCounter(): HTMLElement {
    return make('div', (el: HTMLDListElement) => {
      addClass(el, 'tex-file-counter');
    });
  }

  /** @see FileBlockModel.getFormElement */
  getFormElement(): HTMLElement | null {
    return this.formElement;
  }

  /**
   * Create file upload form with input and label
   * @returns Form element
   */
  protected createForm(): HTMLElement {
    const { blockManager } = this.editor;
    const id = randString(16),
      itemsLength = this.getOption('data', [])?.length || 0,
      fmIcon = this.getConfig('fileManagerBtnIcon') as string;

    return make('div', (form: HTMLElement) => {
      addClass(form, 'tex-file-form');

      const uploader = make('div', (uploaderEl: HTMLElement) => {
        addClass(uploaderEl, 'tex-file-form-uploader tex-no-select');
        const labelFile = this.formLabel(itemsLength, id);
        const inputFile = this.formInputFile(id);
        append(uploaderEl, [inputFile, labelFile]);
      });

      const fileManager = make('div', (fm) => {
        addClass(fm, 'tex-file-form-fileManager tex-no-select');

        const btn = make('button', (btn) => {
          addClass(btn, 'tex-file-form-fileManager-btn');
          attr(btn, 'title', this.getFileManagerTitle());
          attr(btn, 'type', 'button');

          append(
            btn,
            make('span', (spanBtn) => html(spanBtn, fmIcon)),
          );

          if (this.isFileManagerShowTitle()) {
            append(
              btn,
              make('span', (spanText) => {
                addClass(spanText, 'tex-text-span');
                text(spanText, this.getFileManagerTitle());
              }),
            );
          }

          on(btn, 'click.fm', () => {
            const callback = this.getConfig('onOpenFileManager') as CallableFunction;

            if (callback) {
              callback(blockManager.getIndex(this.getElement()), this.getName(), this, this.editor);
            }
          });
        });

        append(fm, btn);
      });

      const btns = [uploader];

      if (this.isFileManager()) {
        if (this.getFileManagerLtr() == 'left') {
          btns.unshift(fileManager);
        } else {
          btns.push(fileManager);
        }
      }

      const uploadsForm = make('div', (uForm) => {
        addClass(uForm, 'tex-file-form-uploads');
      });

      append(uploadsForm, btns);
      append(form, uploadsForm);

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

  /** @see FileBlockModel.getTaskId */
  getTaskId(): string | number {
    return this.taskId;
  }

  /** @see FileBlockModel.setTaskId */
  setTaskId(taskId: string | number): void {
    this.taskId = taskId;
  }

  /** @see FileBlockModel.cancelAsync */
  cancelAsync(): void {
    const { i18n } = this.editor;
    const taskId = this.getTaskId();

    if (!taskId) {
      this.toasts().add(i18n.get('asyncCancelNoTask'), { code: 'error' });
      return;
    }

    if (this.asyncTimerId) {
      clearTimeout(this.asyncTimerId);
      this.asyncTimerId = null;
    }

    const ajaxConfig: AjaxConfig = this.getAsyncCancelConfig();
    const userOptions: AjaxOptions = ajaxConfig?.options || {};
    const url = ajaxConfig.url;
    const { data, method, headers, timeout } = userOptions;
    const formData = this.formData(data);
    formData.append('taskId', taskId.toString());

    ajax<FileAsyncCancelResponse>(url, {
      method: method || 'POST',
      data: formData,
      headers: headers ? { ...headers } : {},
      timeout: timeout || 45000,
      success: (data) => {
        const responseData = data.data;

        if (userOptions.success) {
          userOptions.success(responseData);
        }

        if (responseData?.status === 'cancelled') {
          this.setTaskId('');

          if (responseData?.message)
            this.toasts().add(responseData?.message || i18n.get('asyncCancelSuccess'), { code: 'success' });

          this.change(
            'upload',
            {
              success: true,
              response: data,
            },
            {
              uploadEvent: true,
            },
          );
        } else {
          this.toasts().add(i18n.get('asyncCancelErrorMessage'), { code: 'error' });

          this.change(
            'upload',
            {
              success: false,
              response: data,
            },
            {
              uploadEvent: true,
            },
          );
        }

        this.updateProgress(null);
      },
      error: (errorMessage, response) => {
        if (response.data?.errors && Array.isArray(response.data.errors)) {
          response.data.errors.forEach((item) => {
            this.toasts().add(item, { code: 'error' });
          });
        } else {
          this.toasts().add(errorMessage || i18n.get('asyncCancelErrorMessage'), { code: 'error' });
        }

        if (userOptions.error) {
          userOptions.error(errorMessage, response);
        }

        this.updateProgress(null);

        this.change(
          'upload',
          {
            success: false,
            error: errorMessage,
            response: response.data,
          },
          {
            uploadEvent: true,
          },
        );
      },
    });
  }

  /** @see FileBlockModel.getJobStatus */
  getJobStatus(): string {
    return this.jobStatus;
  }

  /** @see FileBlockModel.setJobStatus */
  setJobStatus(status: string): void {
    this.jobStatus = status;
  }

  /**
   * Check if current job is cancellable
   * @returns True if job is in progress and can be cancelled
   */
  private isCancel(): boolean {
    const jobStatus = this.getJobStatus();

    if (jobStatus === 'chunkUploadProgress' || jobStatus === 'asyncProcessing' || jobStatus === 'uploadProgress')
      return true;

    return false;
  }

  /**
   * Cancel the current upload or async processing job
   */
  cancelUpload(): void {
    const jobStatus = this.getJobStatus();

    if (jobStatus === 'asyncProcessing') {
      if (this.asyncTimerId) {
        clearTimeout(this.asyncTimerId);
        this.asyncTimerId = null;
      }
      this.cancelAsync();
    } else if (jobStatus === 'chunkUploadProgress' || jobStatus === 'uploadProgress') {
      this.abortAllXHRs();
      this.setJobStatus('cancelChunk');
      this.forceRemoveProgress();
    }

    this.updateProgress(null);
  }

  /**
   * Abort all active XHR requests
   */
  private abortAllXHRs(): void {
    this.activeXHRs.forEach((xhr) => {
      try {
        xhr.abort();
      } catch (e) {
        console.warn(e);
      }
    });
    this.activeXHRs.clear();
  }

  /**
   * Add XHR to active requests set for tracking
   * @param xhr - XMLHttpRequest instance to track
   */
  private addActiveXHR(xhr: XMLHttpRequest): void {
    this.activeXHRs.add(xhr);
  }

  /**
   * Remove XHR from active requests set
   * @param xhr - XMLHttpRequest instance to remove
   */
  private removeActiveXHR(xhr: XMLHttpRequest): void {
    this.activeXHRs.delete(xhr);
  }

  /**
   * Force remove progress element immediately without delay
   */
  private forceRemoveProgress(): void {
    if (this.asyncTimerId) {
      clearTimeout(this.asyncTimerId);
      this.asyncTimerId = null;
    }

    if (this.progressElement) {
      this.progressElement.remove();
      this.progressElement = null;
    }

    const form = this.getFormElement();
    if (form) {
      const [label] = queryList<HTMLElement>('.tex-file-form-label', form);
      if (label) {
        css(label, 'visibility', '');
      }
    }

    this.setJobStatus('');
    this.currentFileIndex = 0;
    this.totalFilesCount = 0;
    this.refresh();
  }

  /**
   * Safely update or remove progress bar
   * @param percent - Progress percentage (0-100), null to remove progress bar
   */
  private updateProgress(percent: number | null): void {
    if (percent === null) {
      if (this.asyncTimerId) {
        clearTimeout(this.asyncTimerId);
        this.asyncTimerId = null;
      }

      if (this.progressElement) {
        this.progressElement.remove();
        this.progressElement = null;
      }

      const form = this.getFormElement();
      if (form) {
        const [label] = queryList<HTMLElement>('.tex-file-form-label', form);
        if (label) {
          css(label, 'visibility', '');
        }
      }

      this.setJobStatus('');
      this.refresh();
      return;
    }

    this.createProgress();

    const progressElement = this.getProgressElement();
    const cssName = '.tex-file-form';

    if (progressElement) {
      const isCancel = this.isCancel();

      query(cssName + '-progress-line', (el: HTMLDivElement) => css(el, 'width', percent + '%'), progressElement);

      query(
        cssName + '-progress-percent',
        (el: HTMLDivElement) => {
          let progressText = percent + '%';
          if (this.totalFilesCount > 0) {
            progressText += ` (${this.currentFileIndex}/${this.totalFilesCount})`;
          }
          el.innerText = progressText;
        },
        progressElement,
      );

      query(
        '.tex-file-async-cancel',
        (el: HTMLDivElement) => css(el, 'display', isCancel ? '' : 'none'),
        progressElement,
      );
    }
  }

  /**
   * Process async file upload status checking
   * @returns Promise that resolves when async processing is complete
   */
  private processAsync(): Promise<void> {
    return new Promise((resolve, reject) => {
      const { i18n } = this.editor;
      const ajaxConfig: AjaxConfig = this.getAsyncCheckerConfig();
      const userOptions: AjaxOptions = ajaxConfig?.options || {};
      const url = ajaxConfig.url;
      const taskId = this.getTaskId();

      if (!taskId) {
        this.updateProgress(null);
        reject(new Error('No taskId'));
        return;
      }

      const { data, method, headers, timeout } = userOptions;
      const formData = this.formData(data);
      formData.append('taskId', taskId.toString());

      let attempts = 0;

      const checkStatus = () => {
        attempts++;

        if (this.getJobStatus() === 'cancelChunk') {
          this.updateProgress(null);
          resolve();
          return;
        }

        ajax<FileAsyncCheckerResponse>(url, {
          method: method || 'POST',
          data: formData,
          headers: headers ? { ...headers } : {},
          timeout: timeout || 45000,
          success: (data) => {
            const responseData = data.data;

            if (userOptions.success) {
              userOptions.success(responseData);
            }

            const status = responseData?.status || 'error';
            const progress = responseData?.progress || 5;
            const files = responseData?.files || [];

            if (status == 'processing') {
              this.updateProgress(progress);
              this.setJobStatus('asyncProcessing');
              this.asyncTimerId = window.setTimeout(() => {
                checkStatus();
              }, 2000);
            } else if (status == 'cancelled') {
              this.updateProgress(null);
              this.setTaskId('');
              this.setJobStatus('');
              this.change('upload', { success: false, response: data }, { uploadEvent: true, async: true });
              resolve();
            } else if (status == 'success') {
              if (Array.isArray(files)) {
                (files as FileResponseItem[]).forEach((item) => {
                  if (item.url && item.type) {
                    this.createItem(item, 0, true);
                  }
                  if (item.message) {
                    this.toasts().add(item.message || i18n.get('fileUploadSuccess'), {
                      code: item.status ? 'success' : 'error',
                    });
                  }
                });
              }

              this.updateProgress(null);
              this.setTaskId('');
              this.setJobStatus('');
              this.change('upload', { success: true, response: data }, { uploadEvent: true, async: true });
              resolve();
            } else {
              this.updateProgress(null);
              this.setTaskId('');
              this.setJobStatus('');
              this.toasts().add(i18n.get('asyncErrorMessage'), { code: 'error' });
              this.change('upload', { success: false, response: data }, { uploadEvent: true, async: true });
              resolve();
            }
          },
          error: (errorMessage, response) => {
            if (attempts % 3 === 0) {
              this.updateProgress(null);
              this.setTaskId('');
              this.setJobStatus('');

              if (response.data?.errors && Array.isArray(response.data.errors)) {
                response.data.errors.forEach((item) => {
                  this.toasts().add(item, { code: 'error' });
                });
              } else {
                this.toasts().add(errorMessage || i18n.get('asyncErrorMessage'), { code: 'error' });
              }

              if (userOptions.error) {
                userOptions.error(errorMessage, response);
              }

              this.change(
                'upload',
                { success: false, error: errorMessage, response: response.data },
                { uploadEvent: true },
              );
              resolve();
            } else {
              this.asyncTimerId = window.setTimeout(() => {
                checkStatus();
              }, 5000);
            }
          },
        });
      };

      checkStatus();
    });
  }

  /**
   * Validates a file against size and MIME type constraints.
   * @param file - The file to validate
   * @returns Validation result with error message if invalid
   */
  protected validateFile(file: GlobalFile): { isValid: boolean; error?: string } {
    const { i18n } = this.editor;

    const maxSize = this.getFileMaxSize(),
      mimeTypes = this.getMimeTypes();

    if (maxSize > 0 && file.size > maxSize) {
      return {
        isValid: false,
        error: i18n.get('largeFile', 'The file size is too large') + ': ' + (file.name || ''),
      };
    }

    if (mimeTypes.length > 0 && !mimeTypes.includes(file.type)) {
      return {
        isValid: false,
        error: i18n.get('invalidFileType', 'Invalid file type') + ': ' + (file.name || ''),
      };
    }

    return { isValid: true };
  }

  /**
   * Handle file input change event, process upload
   * @param evt - Base event object with file input element
   */
  protected onChangeFile(evt: Event): void {
    const { i18n } = this.editor,
      input = evt.delegateTarget as HTMLInputElement,
      form = this.getFormElement();

    if (form) {
      const [label] = queryList<HTMLElement>('.tex-file-form-label', form);

      if (label) {
        css(label, 'visibility', 'hidden');

        const maxItems = this.getMaxItems(),
          itemsLength = this.getItemsLength(),
          files = input.files || [],
          errors: string[] = [];

        for (let i = 0; i < files.length; i++) {
          const validated = this.validateFile(files[i]);

          if (!validated.isValid && validated.error) errors.push(validated.error);
        }

        if (errors.length > 0) {
          errors.forEach((error) => this.toasts().add(error, { code: 'error' }));
          this.updateProgress(null);
        } else if (itemsLength + files.length > maxItems || (!this.isMultiple() && itemsLength > 0)) {
          this.toasts().add(i18n.get('fileUploadMaxItems'), { code: 'error' });
          this.updateProgress(null);
        } else {
          this.currentFileIndex = 0;
          this.totalFilesCount = files.length;
          this.updateProgress(0);
          this.upload(input);
        }
      }
    }
  }

  /** @see FileBlockModel.isVisibleCounter */
  isVisibleCounter(): boolean {
    return this.getConfig('visibleCounter', true);
  }

  /** @see FileBlockModel.getMimeTypes */
  getMimeTypes(): string[] {
    return this.getConfig('mimeTypes', []) as string[];
  }

  /** @see FileBlockModel.isMultiple */
  isMultiple(): boolean {
    return this.getConfig('multiple', true);
  }

  /** @see FileBlockModel.getAjaxConfig */
  getAjaxConfig(): AjaxConfig {
    return this.getConfig('ajaxConfig', { url: '' }) as AjaxConfig;
  }

  /** @see FileBlockModel.getAsyncCheckerConfig */
  getAsyncCheckerConfig(): AjaxConfig {
    return this.getConfig('asyncCheckerConfig', { url: '' }) as AjaxConfig;
  }

  /** @see FileBlockModel.getAsyncCancelConfig */
  getAsyncCancelConfig(): AjaxConfig {
    return this.getConfig('asyncCancelConfig', { url: '' }) as AjaxConfig;
  }

  /** @see FileBlockModel.isChunked */
  isChunked(): boolean {
    return this.getConfig('chunked', false);
  }

  /** @see FileBlockModel.getChunkSize */
  getChunkSize(): number {
    return this.getConfig('chunkSize', 2 * 1024 * 1024);
  }

  /** @see FileBlockModel.getFileMaxSize */
  getFileMaxSize(): number {
    return this.getConfig('fileMaxSize', 10 * 1024 * 1024);
  }

  /** @see FileBlockModel.isRetry */
  isRetry(): boolean {
    return this.getConfig('retry', true);
  }

  /** @see FileBlockModel.getRetryDelays */
  getRetryDelays(): number[] {
    return this.getConfig('retryDelays', [0, 3000, 5000, 10000, 20000]) as number[];
  }

  /** @see FileBlockModel.isFileManager */
  isFileManager(): boolean {
    return this.getConfig('fileManager', false);
  }

  /** @see FileBlockModel.isFileManagerShowTitle */
  isFileManagerShowTitle(): boolean {
    return this.getConfig('fileManagerShowTitle', true);
  }

  /** @see FileBlockModel.getFileManagerTitle */
  getFileManagerTitle(): string {
    return this.getConfig('fileManagerTitle', '');
  }

  /** @see FileBlockModel.getFileManagerLtr */
  getFileManagerLtr(): string {
    return this.getConfig('fileManagerLtr', 'right');
  }

  /** @see FileBlockModel.getInputName */
  getInputName(): string {
    return this.getConfig('inputName', 'files');
  }

  /** @see FileBlockModel.isRequiredFieldName */
  isRequiredFieldFileName(): boolean {
    return this.getConfig('requiredFieldFileName', true);
  }

  /** @see FileBlockModel.isRequiredFieldCaption */
  isRequiredFieldCaption(): boolean {
    return this.getConfig('requiredFieldCaption', true);
  }

  /** @see FileBlockModel.isRequiredFieldDesc */
  isRequiredFieldDesc(): boolean {
    return this.getConfig('requiredFieldDesc', true);
  }

  /** @see FileBlockModel.isVisibleFieldName */
  isVisibleFieldFileName(): boolean {
    return this.getConfig('visibleFieldFileName', true);
  }

  /** @see FileBlockModel.isVisibleFieldCaption */
  isVisibleFieldCaption(): boolean {
    return this.getConfig('visibleFieldCaption', true);
  }

  /** @see FileBlockModel.isVisibleFieldDesc */
  isVisibleFieldDesc(): boolean {
    return this.getConfig('visibleFieldDesc', true);
  }

  /** @see FileBlockModel.isRenderImage */
  isRenderImage(): boolean {
    return this.getConfig('renderImage', true);
  }

  /** @see FileBlockModel.isLinkStrategy */
  isLinkStrategy(): boolean {
    return this.getConfig('linkStrategy', false);
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
      addClass(label, 'tex-file-form-label');
      label.id = 'label-' + id;

      const labelWrap = make('div', (wrap) => {
        addClass(wrap, 'tex-file-form-label-wrap');
        const labelCnt = make('div', (labelContainer: HTMLDivElement) => {
          addClass(labelContainer, 'tex-file-form-label-container');

          const btnText = isMultiple ? (length >= 1 ? addLabelText : multipleLabelText) : labelText;

          attr(label, 'title', btnText);

          const text = make('span', (span: HTMLSpanElement) => {
              addClass(span, 'tex-text-span');
              html(span, btnText);
            }),
            icon = make('span', (span: HTMLSpanElement) => (span.innerHTML = iconLabel));

          append(labelContainer, [icon, text]);
        });

        append(wrap, [labelCnt]);

        const counterElement = this.getCounterElement();

        if (counterElement && this.isVisibleCounter()) append(wrap, counterElement);
      });

      const uploadLabelMessage = this.getConfig('uploadLabelMessage', ''),
        showOnlyWhenEmpty = this.getConfig('showOnlyWhenEmpty', false),
        labelItems = [labelWrap];

      if (!isEmptyString(uploadLabelMessage)) {
        const labelMessage = make('div', (msg: HTMLDivElement) => {
          addClass(msg, 'tex-file-form-label-message');
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
  protected createList(): boolean {
    const contentElement = this.getContentElement(),
      items = this.getOption('data', []) as FileItem[];

    let filtered: FileItem[] = [];

    this.onCreateList(contentElement);

    if (items.length && Array.isArray(items)) {
      const maxItems = this.getMaxItems();

      if (this.isLinkStrategy()) {
        filtered = items.filter((item) => item?.url && item?.type);
      } else {
        filtered = items.filter((item) => item?.url && item?.type && item?.id && item.id > 0);
      }

      if (filtered.length > maxItems) filtered = filtered.slice(0, maxItems);

      filtered.forEach((item: FileItem, index) => this.createItem(item, index, true));

      show(contentElement);
    }

    if (!filtered.length) {
      return false;
    }

    this.onCreatedList(contentElement);

    return true;
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
    const className = this.getItemClassName(),
      fileCss = 'tex-file-item',
      blockElement = this.getElement();

    let itemElement = make('div') as FileItemElement;

    if (blockElement) {
      itemElement = make('div', (el: FileItemElement) => {
        addClass(el, 'tex-item  ' + fileCss + ' ' + className);
        el.id = blockElement.id + '-' + randString(12);
        el.fileType = item?.type || '';
        el.fileUrl = item?.url || '';

        if (item?.realName || item?.name) el.fileName = item.realName || item.name;
        if (item?.size) el.fileSize = item.size;
        if (item?.id) el.fileId = item.id;
        if (item?.thumbnail) el.thumbnail = item.thumbnail;
        if (item.caption) el.fileCaption = decodeHtml(item.caption);
        if (item.desc) el.fileDesc = decodeHtml(item.desc);

        const wrapper = make('div', (wrap: HTMLElement) => {
          const sourceElement = this.renderItem(item, el);
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
    const cssName = 'tex-file-actions',
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
        const btnClassName = 'tex-file-actions-btn';
        addClass(buttons, 'tex-file-actions-buttons');

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
        (evt: MouseEvent) => {
          let isIgnore = false;
          const skipSelectors = this.getConfig('actionSkipSelector', '');

          if (skipSelectors) {
            query(
              skipSelectors,
              (ignored) => {
                if (closest(evt.target, ignored)) {
                  evt.preventDefault();
                  isIgnore = true;
                }
              },
              itemElement,
            );
          }

          if (!isIgnore) {
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
          }
        },
        true,
      );
    }
  }

  /** @see FileBlockModel.getFileActions */
  getFileActions(): FileActionModel[] {
    return this.fileActions;
  }

  /**
   * Create progress bar element for upload
   */
  protected createProgress(): void {
    const form = this.getFormElement();

    if (form && !this.progressElement) {
      this.progressElement = make('div', (div: HTMLDivElement) => {
        addClass(div, 'tex-file-form-progress');
        append(div, [
          make('div', (pro: HTMLDivElement) => {
            addClass(pro, 'tex-file-form-progress-line');
          }),
          make('div', (per: HTMLDivElement) => {
            addClass(per, 'tex-file-form-progress-percent');
          }),
        ]);

        const cancelConfig = this.getAsyncCancelConfig();
        if (cancelConfig.url) {
          append(div, [
            make('div', (cancel) => {
              addClass(cancel, 'tex-file-async-cancel');
              css(cancel, 'display', 'none');
              html(
                cancel,
                renderIcon(IconClose, {
                  width: 8,
                  height: 8,
                }),
              );

              on(cancel, 'click.cn', () => this.cancelUpload());
            }),
          ]);
        }
      });

      const [uploaderNode] = queryList<HTMLElement>('.tex-file-form-uploader', form);

      if (uploaderNode) {
        append(uploaderNode, this.progressElement);
      }
    }
  }

  /** @see FileBlockModel.getProgressElement */
  getProgressElement(): HTMLElement | null {
    return this.progressElement;
  }

  /** @see FileBlockModel.progress */
  progress(percent: number): void {
    this.updateProgress(percent);
  }

  /** @see FileBlockModel.removeProgress */
  removeProgress(): void {
    this.updateProgress(null);
    this.currentFileIndex = 0;
    this.totalFilesCount = 0;
  }

  /**
   * Converts plain object data into FormData.
   * @param data - Object to convert
   * @returns FormData instance
   */
  private formData(data?: AjaxData): FormData {
    const formData = new FormData();

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

    return formData;
  }

  /**
   * Compute SHA-256 hash of an ArrayBuffer
   * @param data - Data to hash
   * @returns Hex string hash
   */
  private async computeSHA256(data: ArrayBuffer): Promise<string> {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      return this.bufferToHex(hashBuffer);
    }

    return this.computeSHA256Fallback(data);
  }

  /**
   * Convert ArrayBuffer to hex string
   * @param buffer - Buffer to convert
   * @returns Hex string
   */
  private bufferToHex(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let hex = '';

    for (let i = 0; i < bytes.length; i++) {
      hex += bytes[i].toString(16).padStart(2, '0');
    }

    return hex;
  }

  /**
   * Fallback SHA-256 implementation when crypto.subtle is unavailable
   * @param data - Data to hash
   * @returns Hex string hash
   */
  private computeSHA256Fallback(data: ArrayBuffer): string {
    const bytes = new Uint8Array(data);
    const H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    const K = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98,
      0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
      0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8,
      0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
      0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819,
      0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
      0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7,
      0xc67178f2,
    ];

    const r = (x: number, n: number) => (x >>> n) | (x << (32 - n));
    const msgLen = bytes.length;
    const bitLen = msgLen * 8;

    const withPadding = new Uint8Array((((msgLen + 9) >> 6) + 1) << 6);
    withPadding.set(bytes);
    withPadding[msgLen] = 0x80;
    const dv = new DataView(withPadding.buffer);
    dv.setUint32(withPadding.length - 4, bitLen >>> 0, false);
    dv.setUint32(withPadding.length - 8, Math.floor(bitLen / 0x100000000), false);

    const w = new Uint32Array(64);

    for (let offset = 0; offset < withPadding.length; offset += 64) {
      for (let i = 0; i < 16; i++) {
        w[i] = dv.getUint32(offset + i * 4, false);
      }

      for (let i = 16; i < 64; i++) {
        const s0 = r(w[i - 15], 7) ^ r(w[i - 15], 18) ^ (w[i - 15] >>> 3);
        const s1 = r(w[i - 2], 17) ^ r(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
      }

      let [a, b, c, d, e, f, g, h] = H;

      for (let i = 0; i < 64; i++) {
        const S1 = r(e, 6) ^ r(e, 11) ^ r(e, 25);
        const ch = (e & f) ^ (~e & g);
        const temp1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
        const S0 = r(a, 2) ^ r(a, 13) ^ r(a, 22);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const temp2 = (S0 + maj) >>> 0;
        h = g;
        g = f;
        f = e;
        e = (d + temp1) >>> 0;
        d = c;
        c = b;
        b = a;
        a = (temp1 + temp2) >>> 0;
      }

      H[0] = (H[0] + a) >>> 0;
      H[1] = (H[1] + b) >>> 0;
      H[2] = (H[2] + c) >>> 0;
      H[3] = (H[3] + d) >>> 0;
      H[4] = (H[4] + e) >>> 0;
      H[5] = (H[5] + f) >>> 0;
      H[6] = (H[6] + g) >>> 0;
      H[7] = (H[7] + h) >>> 0;
    }

    return H.map((x) => x.toString(16).padStart(8, '0')).join('');
  }

  /**
   * Compute SHA-256 hash of entire file
   * @param file - File to hash
   * @returns Hex string hash
   */
  private async computeFileSHA256(file: GlobalFile): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    return this.computeSHA256(arrayBuffer);
  }

  /**
   * Handles successful upload response.
   * Routes to async processing or creates file item based on response status.
   * @param data - Response data from server
   * @param options - AJAX configuration options
   * @returns Promise that resolves when processing is complete
   */
  protected async uploadSuccess(data: FileAjaxResponse, options: AjaxOptions<FileAjaxResponse>): Promise<void> {
    const { i18n } = this.editor;

    if (!data.success) {
      this.updateProgress(null);

      if (data?.errors && Array.isArray(data.errors)) {
        data.errors.forEach((item) => this.toasts().add(item));
      } else {
        this.toasts().add(i18n.get('fileUploadError'));
      }

      return;
    }

    const isAsyncTask =
      !Array.isArray(data.data) &&
      data.data?.status &&
      (data.data.status === 'processing' || data.data.status === 'async');

    if (isAsyncTask) {
      const asyncResponse = data.data as FileAsyncResponse;

      if (asyncResponse?.taskId) {
        this.setTaskId(asyncResponse.taskId);
        this.setJobStatus('asyncProcessing');
        this.updateProgress(5);
        this.toasts().add(asyncResponse?.message || i18n.get('asyncMessage', ''), { code: 'success' });

        try {
          await this.processAsync();
        } catch (error) {
          console.error('Async processing error:', error);
          this.updateProgress(null);
        }
      } else {
        this.updateProgress(null);
        this.toasts().add(i18n.get('asyncErrorMessage', ''), { code: 'error' });
      }
    } else {
      const responseData = data.data as FileResponseItem;

      if (responseData?.url && responseData?.type) {
        this.createItem(responseData, 0, true);
        this.toasts().add(responseData?.message || i18n.get('fileUploadSuccess'), { code: 'success' });
      }

      this.updateProgress(null);
    }

    if (options?.success) {
      options.success(data);
    }

    this.change(
      'upload',
      {
        success: true,
        response: data,
      },
      {
        uploadEvent: true,
      },
    );
  }

  /**
   * Handles upload errors
   * @param errorMessage - Error message string
   * @param response - AJAX response object
   * @param options - AJAX configuration options
   * @returns void
   */
  protected uploadError(
    errorMessage: string,
    response: AjaxResponse<FileAjaxResponse>,
    options: AjaxOptions<FileAjaxResponse>,
  ) {
    const { i18n } = this.editor;

    this.toasts().add(response?.data?.message || i18n.get('fileUploadError') + ': ' + response.error);

    if (response?.data?.errors && Array.isArray(response?.data?.errors)) {
      response.data.errors.forEach((item) => {
        this.toasts().add(item, { code: 'error' });
      });
    }

    if (options?.error) {
      options.error(errorMessage, response);
    }

    this.updateProgress(null);
    this.setJobStatus('');
    this.change(
      'upload',
      {
        success: false,
        error: errorMessage,
        response: response.data,
      },
      {
        uploadEvent: true,
      },
    );
  }

  /**
   * Initiates AJAX file upload
   * Validates URL and processes selected files.
   * @param input - File input element containing selected files
   * @returns void
   */
  protected upload(input: HTMLInputElement): void {
    const { i18n } = this.editor;
    const ajaxConfig = this.getAjaxConfig();
    const url = ajaxConfig.url;

    if (isEmptyString(url)) {
      this.toasts().add(i18n.get('emptyUrl'));
      this.updateProgress(null);
      return;
    }

    const userOptions = ajaxConfig.options || {};

    this.setJobStatus('upload');

    if (input.files && input.files.length > 0) {
      const files = Array.from(input.files) as GlobalFile[];
      this.processFiles(files, url, userOptions);
    }
  }

  /**
   * Processes multiple files sequentially.
   * @param files - Array of files to upload
   * @param url - Upload endpoint URL
   * @param options - AJAX configuration options
   * @returns Promise that resolves when all files are processed
   */
  private async processFiles(files: GlobalFile[], url: string, options: AjaxOptions<FileAjaxResponse>): Promise<void> {
    this.currentFileIndex = 0;
    this.totalFilesCount = files.length;

    for (let i = 0; i < files.length; i++) {
      if (this.getJobStatus() === 'cancelChunk') break;

      const file = files[i];
      this.currentFileIndex = i + 1;
      this.updateProgress(0);

      const needChunked = this.isChunked() && file.size > this.getChunkSize();

      if (needChunked) {
        await this.uploadChunked(file, url, options);
      } else {
        await this.uploadSingle(file, url, options);
      }
    }

    this.currentFileIndex = 0;
    this.totalFilesCount = 0;
  }

  /**
   * Uploads a single file via AJAX.
   * @param file - File to upload
   * @param url - Upload endpoint URL
   * @param options - AJAX configuration options
   * @returns Promise that resolves when upload completes
   */
  protected async uploadSingle(file: GlobalFile, url: string, options: AjaxOptions<FileAjaxResponse>): Promise<void> {
    const { data, method } = options || {};
    const formData = this.formData(data);
    const inputName = this.getInputName();
    const fileId = generateUUID();
    const fileHash = await this.computeFileSHA256(file);

    formData.append(inputName + '[]', file);
    formData.append('fileId', fileId);
    formData.append('fileHash', fileHash);

    return new Promise<void>((resolve) => {
      const xhr = ajax<FileAjaxResponse>(url, {
        method: method || 'POST',
        data: formData,
        progress: (percent, loaded, total) => {
          if (this.getJobStatus() === 'cancelChunk') {
            xhr.abort();
            this.forceRemoveProgress();
            return;
          }
          this.updateProgress(percent);
          this.setJobStatus('uploadProgress');
          options?.progress?.(percent, loaded, total);
        },
        success: async (data) => {
          this.removeActiveXHR(xhr);
          if (this.getJobStatus() !== 'cancelChunk') {
            await this.uploadSuccess(data, options);
          }
          resolve();
        },
        error: (errorMessage, response) => {
          this.removeActiveXHR(xhr);
          if (this.getJobStatus() !== 'cancelChunk') {
            this.uploadError(errorMessage, response, options);
          } else {
            this.forceRemoveProgress();
          }
          resolve();
        },
        headers: options?.headers ? { ...options.headers } : {},
        timeout: options?.timeout || 45000,
      });

      this.addActiveXHR(xhr);
    });
  }

  /**
   * Uploads large files in chunks.
   * @param file - File to upload in chunks
   * @param url - Upload endpoint URL
   * @param options - AJAX configuration options
   * @returns Promise that resolves when all chunks are uploaded or upload is cancelled
   */
  protected async uploadChunked(file: GlobalFile, url: string, options: AjaxOptions<FileAjaxResponse>): Promise<void> {
    const chunkSize = this.getChunkSize();
    const totalChunks = Math.ceil(file.size / chunkSize);
    const fileId = generateUUID();
    const fileHash = await this.computeFileSHA256(file);

    const chunkHashes: string[] = [];

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);
      const buffer = await chunk.arrayBuffer();
      chunkHashes[i] = await this.computeSHA256(buffer);
    }

    const recalculateSet = new Set<number>();
    let lastResponse: FileAjaxResponse | null = null;
    let cancelled = false;

    let i = 0;
    while (i < totalChunks) {
      if (this.getJobStatus() === 'cancelChunk') {
        cancelled = true;
        break;
      }

      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);
      const isLast = i === totalChunks - 1;

      try {
        const result = await this.sendChunkWithRetry(
          url,
          fileId,
          file,
          fileHash,
          chunk,
          i,
          totalChunks,
          chunkHashes[i],
          options,
        );

        if (result === null) {
          if (this.getJobStatus() === 'cancelChunk') {
            cancelled = true;
            break;
          }

          cancelled = true;
          break;
        }

        if (typeof result === 'object' && 'recalculate' in result && result.recalculate) {
          recalculateSet.clear();

          const list = Array.isArray(result.recalculateChunks) ? result.recalculateChunks : [];

          for (const idx of list) {
            if (idx >= 0 && idx < totalChunks) {
              recalculateSet.add(idx);
            }
          }

          if (recalculateSet.size > 0) {
            const sorted = Array.from(recalculateSet).sort((a, b) => a - b);
            i = sorted[0];
            continue;
          }

          continue;
        }

        const body = result as FileAjaxResponse;

        if (isLast) {
          lastResponse = body;
        }

        i++;
      } catch (err) {
        console.warn(err);
        cancelled = true;
        break;
      }
    }

    if (cancelled || this.getJobStatus() === 'cancelChunk') {
      this.forceRemoveProgress();
      this.change(
        'upload',
        {
          success: false,
          error: 'Upload cancelled',
          response: null,
        },
        {
          uploadEvent: true,
        },
      );
      return;
    }

    if (lastResponse) {
      await this.uploadSuccess(lastResponse, options);
    }
  }

  /**
   * Send single chunk with retry and recalculate support
   * @param url - Upload endpoint URL
   * @param fileId - File UUID
   * @param file - Source file
   * @param fileHash - SHA-256 of whole file
   * @param chunk - Chunk blob
   * @param chunkIndex - Chunk index
   * @param totalChunks - Total chunks count
   * @param chunkHash - SHA-256 of chunk
   * @param options - AJAX configuration options
   * @returns Response or recalculate descriptor or null on failure
   */
  private async sendChunkWithRetry(
    url: string,
    fileId: string,
    file: GlobalFile,
    fileHash: string,
    chunk: Blob,
    chunkIndex: number,
    totalChunks: number,
    chunkHash: string,
    options: AjaxOptions<FileAjaxResponse>,
  ): Promise<FileAjaxResponse | { recalculate: true; recalculateChunks: number[] } | null> {
    const retries = this.isRetry() ? this.getRetryDelays().length : 1;
    const delays = this.getRetryDelays();
    const chunkSize = this.getChunkSize();

    for (let attempt = 0; attempt < retries; attempt++) {
      if (this.getJobStatus() === 'cancelChunk') return null;

      if (attempt > 0) {
        const delayMs = delays[attempt] ?? 0;
        await this.delay(delayMs);
        if (this.getJobStatus() === 'cancelChunk') return null;
      }

      const formData = this.formData(options?.data);
      formData.append('chunk', chunk, file.name);
      formData.append('fileId', fileId);
      formData.append('fileSize', String(file.size));
      formData.append('fileName', file.name);
      formData.append('fileType', file.type);
      formData.append('fileHash', fileHash);
      formData.append('chunkIndex', String(chunkIndex));
      formData.append('totalChunks', String(totalChunks));
      formData.append('chunkHash', chunkHash);

      try {
        const result = await new Promise<FileAjaxResponse | { recalculate: true; recalculateChunks: number[] }>(
          (resolveChunk, rejectChunk) => {
            if (this.getJobStatus() === 'cancelChunk') {
              rejectChunk(new Error('Upload cancelled'));
              return;
            }

            const xhr = ajax<FileAjaxResponse>(url, {
              method: 'POST',
              data: formData,
              progress: (_pct: number, loaded: number) => {
                if (this.getJobStatus() === 'cancelChunk') {
                  xhr.abort();
                  rejectChunk(new Error('Upload cancelled'));
                  return;
                }

                const loadedInChunk = Math.min(loaded, chunk.size);
                const overallPct = Math.round(((chunkIndex * chunkSize + loadedInChunk) / file.size) * 100);
                this.updateProgress(overallPct);
                this.setJobStatus('chunkUploadProgress');

                if (options?.progress) {
                  options.progress(overallPct, chunkIndex * chunkSize + loadedInChunk, file.size);
                }
              },
              success: (response) => {
                this.removeActiveXHR(xhr);

                if (this.getJobStatus() === 'cancelChunk') {
                  rejectChunk(new Error('Upload cancelled'));
                  return;
                }

                const data = response.data;

                if (
                  data &&
                  typeof data === 'object' &&
                  'recalculate' in data &&
                  (data as { recalculate?: boolean }).recalculate === true
                ) {
                  const recalculateChunks = Array.isArray((data as { recalculateChunks?: number[] }).recalculateChunks)
                    ? (data as { recalculateChunks: number[] }).recalculateChunks
                    : [];
                  resolveChunk({ recalculate: true, recalculateChunks });
                  return;
                }

                resolveChunk(response);
              },
              error: (errorMessage, response) => {
                this.removeActiveXHR(xhr);
                rejectChunk({ errorMessage, response });
              },
              headers: options?.headers ? { ...options.headers } : {},
              timeout: options?.timeout || 45000,
            });

            this.addActiveXHR(xhr);
          },
        );

        return result;
      } catch (err) {
        if (this.getJobStatus() === 'cancelChunk') return null;

        const isLastAttempt = attempt === retries - 1;

        if (isLastAttempt) {
          const errorMessage =
            typeof err === 'object' && err !== null && 'errorMessage' in err
              ? (err as { errorMessage: string }).errorMessage
              : String(err);

          const response =
            typeof err === 'object' && err !== null && 'response' in err
              ? (err as { response: AjaxResponse<FileAjaxResponse> }).response
              : ({} as AjaxResponse<FileAjaxResponse>);

          this.uploadError(errorMessage, response, options);
          return null;
        }
      }
    }

    return null;
  }

  /**
   * Delay execution
   * @param ms - Milliseconds
   * @returns Promise that resolves after delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Prepares file items data from DOM elements for save.
   *
   * @param blockElement - Optional block element to query within
   * @returns Array of prepared file items with all available fields
   */
  protected prepareItems(blockElement?: BlockElement): FileItem[] {
    const root = blockElement || this.getElement();
    const items: FileItem[] = [];

    query(
      '.tex-file-item',
      (el: FileItemElement) => {
        const preparedItem: FileItem = {
          url: el.fileUrl || '',
          type: el.fileType || '',
        };

        if (el?.fileCaption) preparedItem.caption = el.fileCaption;
        if (el?.fileDesc) preparedItem.desc = el?.fileDesc;
        if (el.fileName) preparedItem.name = el.fileName;
        if (el.fileSize) preparedItem.size = el.fileSize;
        if (el.fileId) preparedItem.id = el.fileId;
        if (el.thumbnail) preparedItem.thumbnail = el.thumbnail;

        if (preparedItem.url && preparedItem.type) {
          items.push(preparedItem);
        }
      },
      root,
    );

    return items;
  }

  /**
   * Saves block data to output format
   * @param blockSchema - Block schema
   * @param blockElement - Block element
   * @param strictMode - Strict Mode
   * @returns The modified block output.
   */
  protected save(blockSchema: BlockSchema, blockElement?: BlockElement, strictMode?: boolean): BlockSchema {
    const items = this.prepareItems(blockElement);
    let data = items;

    if (strictMode) {
      data = this.isLinkStrategy()
        ? items
        : items
            .filter((item) => item.id && item.id > 0)
            .map(({ id, caption, desc }) => ({ id, caption, desc }) as FileItem);
    }

    return {
      ...blockSchema,
      data: data as BlockSchemaData,
    };
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
   * Clean up event listeners and active XHR requests on destroy
   */
  destroy(): void {
    const eid = this.getEventId();
    off(document, 'click.cab' + eid);

    if (this.asyncTimerId) {
      clearTimeout(this.asyncTimerId);
      this.asyncTimerId = null;
    }

    this.abortAllXHRs();
    this.updateProgress(null);
  }
}
