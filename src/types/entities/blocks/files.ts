import {
  BlockModelConfig,
  BlockModel,
  FileActionModelConstructor,
  FileActionModel,
} from "../../";

import {
  AjaxConfig,
  RenderIconContent
} from "@/types";

export interface FilesBlockModelConfig extends BlockModelConfig {
  showOnlyWhenEmpty: boolean;
  multiple: boolean;
  messageTimeout: number;
  mimeTypes: string[];
  inputName: string;
  fileCss: string;
  uploadLabelIcon: RenderIconContent;
  uploadLabelIconWidth: number;
  uploadLabelIconHeight: number;
  uploadMultipleLabelText: string;
  uploadAddLabelText: string;
  uploadLabelText: string;
  uploadLabelMessage: string;
  ajaxConfig: AjaxConfig;
  maxItems: number;
  visibleCounter: boolean;
  requiredFieldFileName: boolean;
  requiredFieldCaption: boolean;
  requiredFieldDesc: boolean;
  visibleFieldFileName: boolean;
  visibleFieldCaption: boolean;
  visibleFieldDesc: boolean;
  renderImage: boolean;
  actions: FileActionModelConstructor[]
}

export interface FilesAjaxResponse {
  data: FileItem[];
  success: boolean;
  message: string;
  [key: string]: unknown;
}

export interface FileItem {
  url: string;
  type: string;
  thumbnail?: string;
  caption?: string;
  desc?: string;
  name?: string;
  size?: number;
  id?: number;
  [key: string]: unknown;
}

export interface FileItemElement extends HTMLElement {
  fileType: string;
  fileUrl: string;
  fileSize?: number;
  fileName?: string;
  fileCaption?: string;
  fileDesc?: string;
  fileId?: number;
  thumbnail?: string;
}

export interface FilesCreateOptions {
  [key: string]: unknown;
}

export interface FilesBlockModel extends BlockModel {
  /**
   * Get render callback function for a specific MIME type
   * @param mimeType - MIME type string
   * @returns Render callback function
   */
  getRenderCallback(mimeType: string): CallableFunction;

  /**
   * Set render callback function for one or more MIME types
   * @param mimeType - Single MIME type or array of MIME types
   * @param callback - Render callback function
   */
  setRenderCallback(mimeType: string | string[], callable: CallableFunction): void;

  /**
   * Get the toast notifications container element
   * @returns Toast container element or null
   */
  getToastsNode(): HTMLElement | null;

  /**
   * Clear all toast notifications
   */
  clearToasts(): void;

  /**
   * Add a toast notification message
   * @param message - Notification message text
   * @param status - Message status type (default: "error")
   */
  addToast(message: string, status?: string): void;

  /**
   * Get the form container element
   * @returns Form element or null
   */
  getFormNode(): HTMLElement | null;

  /**
   * Get maximum allowed items count
   * @returns Maximum items number
   */
  getMaxItems(): number;

  /**
   * Get message auto-hide timeout in milliseconds
   * @returns Timeout duration
   */
  getMessageTimeout(): number;

  /**
   * Check if item counter is visible
   * @returns Visibility state
   */
  isVisibleCounter(): boolean;

  /**
   * Get configured MIME types for file upload
   * @returns Array of allowed MIME types
   */
  getMimeTypes(): string[];

  /**
   * Check if multiple file upload is enabled
   * @returns Multiple files flag
   */
  isMultiple(): boolean;

  /**
   * Get AJAX configuration for file upload
   * @returns AJAX configuration object
   */
  getAjaxConfig(): AjaxConfig;

  /**
   * Get input name attribute for file upload
   * @returns Input name string
   */
  getInputName(): string;

  /**
   * Checks if the file name is required
   * @returns True if required, `false` otherwise
   */
  isRequiredFieldFileName(): boolean;

  /**
 * Checks if the caption is required
 * @returns True if required, `false` otherwise
 */
  isRequiredFieldCaption(): boolean;

  /**
  *Checks if the description is required
  * @returns True if required, `false` otherwise
  */
  isRequiredFieldDesc(): boolean;

  /**
   * Checks if the file name is visible
   * @returns True if visible, `false` otherwise
   */
  isVisibleFieldFileName(): boolean;

  /**
 * Checks if the caption is visible
 * @returns True if visible, `false` otherwise
 */
  isVisibleFieldCaption(): boolean;

  /**
  *Checks if the description is visible
  * @returns True if visible, `false` otherwise
  */
  isVisibleFieldDesc(): boolean;

  /**
   * Checks if the image should be rendered.
   * @returns True if ready, false otherwise.
   */
  isRenderImage(): boolean;

  /**
   * Get the upload progress bar element
   * @returns Progress element or null
   */
  getProgressNode(): HTMLElement | null;

  /**
   * Update progress bar percentage
   * @param percent - Progress percentage value
   */
  progress(percent: number): void;

  /**
   * Remove progress bar from DOM
   */
  removeProgress(): void;

  /**
   * Refresh block UI state based on current items
   */
  refresh(): void;

  /**
   * Refresh counter with current item count
   * @param count - Optional count override
   */
  refreshCount(count?: number): void;

  /**
   * Get the counter DOM element
   * @returns Counter element or null
   */
  getCounterNode(): HTMLElement | null;

  /** 
   * Get action models with a file.
   * @returns List of file action models
   */
  getFileActions(): FileActionModel[];
}