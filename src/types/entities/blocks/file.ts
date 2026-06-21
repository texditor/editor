import { BlockModelConfig, BlockModel, FileActionModelConstructor, FileActionModel } from '../..';
import { AjaxConfig, RenderIconContent } from '@/types';

export interface FileBlockModelConfig extends BlockModelConfig {
  /**
   * Show upload label only when block is empty
   * @default false
   */
  showOnlyWhenEmpty: boolean;

  /**
   * Allow multiple file upload
   * @default true
   */
  multiple: boolean;

  /**
   * Timeout for toast messages in milliseconds
   * @default 3000
   */
  messageTimeout: number;

  /**
   * Array of allowed MIME types for file upload
   * @default []
   */
  mimeTypes: string[];

  /**
   * Name attribute for file input element
   * @default 'files'
   */
  inputName: string;

  /**
   * CSS class for file items
   * @default 'tex-file-item-default'
   */
  fileCss: string;

  /**
   * Icon HTML content for upload label
   * @default IconPlus
   */
  uploadLabelIcon: RenderIconContent;

  /**
   * Width of upload label icon in pixels
   * @default 12
   */
  uploadLabelIconWidth: number;

  /**
   * Height of upload label icon in pixels
   * @default 12
   */
  uploadLabelIconHeight: number;

  /**
   * Text for upload label when multiple files allowed (no files yet)
   * @default 'Upload files'
   */
  uploadMultipleLabelText: string;

  /**
   * Text for upload label when adding more files
   * @default 'Add files'
   */
  uploadAddLabelText: string;

  /**
   * Text for upload label when single file mode
   * @default 'Upload file'
   */
  uploadLabelText: string;

  /**
   * Additional message text below upload label
   * @default ''
   */
  uploadLabelMessage: string;

  /**
   * Configuration for main upload AJAX request
   * @default { url: '' }
   */
  ajaxConfig: AjaxConfig;

  /**
   * Configuration for async upload status checking AJAX request
   * Used to poll upload progress for async tasks
   * @default { url: '' }
   */
  asyncCheckerConfig: AjaxConfig;

  /**
   * Configuration for async upload cancellation AJAX request
   * Used to cancel ongoing async upload tasks
   * @default { url: '' }
   */
  asyncCancelConfig: AjaxConfig;

  /**
   * Show file counter (current/total items)
   * @default true
   */
  visibleCounter: boolean;

  /**
   * Make file name field required in edit mode
   * @default true
   */
  requiredFieldFileName: boolean;

  /**
   * Make caption field required in edit mode
   * @default true
   */
  requiredFieldCaption: boolean;

  /**
   * Make description field required in edit mode
   * @default true
   */
  requiredFieldDesc: boolean;

  /**
   * Show file name field in edit mode
   * @default true
   */
  visibleFieldFileName: boolean;

  /**
   * Show caption field in edit mode
   * @default true
   */
  visibleFieldCaption: boolean;

  /**
   * Show description field in edit mode
   * @default true
   */
  visibleFieldDesc: boolean;

  /**
   * Render image preview for image files
   * @default true
   */
  renderImage: boolean;

  /**
   * Array of file action model constructors
   * Actions displayed when clicking on file item
   * @default [MoveLeftFileAction, EditFileAction, DownloadFileAction, DeleteFileAction, MoveRightFileAction]
   */
  actions: FileActionModelConstructor[];

  /**
   * Use link strategy for file items (save only url and type instead of id)
   * When true, files without id can be saved as links
   * @default false
   */
  linkStrategy: boolean;

  /**
   * CSS selectors for elements that skip action menu activation.
   * @default ''
   */
  actionSkipSelector: string;
}

/**
 * Response structure for file upload AJAX requests
 * Supports both regular (array of files) and async (task-based) responses
 */
export interface FileAjaxResponse {
  /**
   * Response data - either array of file items or async task response
   */
  data: FileResponseItem[] | FileAsyncResponse;

  /**
   * Indicates if the request was successful
   */
  success: boolean;

  /**
   * Response message from server
   */
  message: string;

  /**
   * Array of error messages if any
   */
  errors: string[];

  /**
   * Additional dynamic properties
   */
  [key: string]: unknown;
}

/**
 * Response structure for async upload status checking requests
 */
export interface FileAsyncCheckerResponse {
  /**
   * Response data containing status, progress and files
   */
  data: {
    /**
     * Current task status: 'processing', 'success', 'cancelled', 'error'
     */
    status: string;

    /**
     * Upload progress percentage (0-100)
     */
    progress: number;

    /**
     * Array of successfully uploaded files
     */
    files: FileResponseItem[];
  };

  /**
   * Indicates if the status check was successful
   */
  success: boolean;

  /**
   * Response message from server
   */
  message: string;

  /**
   * Array of error messages if any
   */
  errors: string[];

  /**
   * Additional dynamic properties
   */
  [key: string]: unknown;
}

/**
 * Response structure for async upload cancellation requests
 */
export interface FileAsyncCancelResponse {
  /**
   * Response data containing cancellation status
   */
  data: {
    /**
     * Current task status after cancellation attempt
     */
    status: string;

    /**
     * Task ID that was cancelled
     */
    taskId?: string | number;

    /**
     * Optional message about cancellation result
     */
    message?: string;
  };

  /**
   * Indicates if the cancellation was successful
   */
  success: boolean;

  /**
   * Response message from server
   */
  message: string;

  /**
   * Array of error messages if any
   */
  errors: string[];

  /**
   * Additional dynamic properties
   */
  [key: string]: unknown;
}

/**
 * Response structure for async upload initialization
 * Returned when server creates an async task for file processing
 */
export interface FileAsyncResponse {
  /**
   * Optional message about async task creation
   */
  message?: string;

  /**
   * Unique task identifier for status polling
   */
  taskId: string | number;

  /**
   * Task status indicator
   */
  status: boolean | "processing" | "async";

  /**
   * Total size of uploaded files in bytes
   */
  totalSize?: number;

  /**
   * Number of files in the upload batch
   */
  filesCount?: number;
}

/**
 * Single file item in upload response
 * Extends FileItem with response-specific fields
 */
export interface FileResponseItem extends FileItem {
  /**
   * Optional message about this specific file
   */
  message?: string;

  /**
   * Upload status for this file
   */
  status?: boolean;
}

/**
 * Core file item data structure
 * Represents a file stored in the block
 */
export interface FileItem {
  /**
   * File URL or path
   */
  url?: string;

  /**
   * MIME type of the file
   */
  type?: string;

  /**
   * Thumbnail URL for image/video files
   */
  thumbnail?: string;

  /**
   * Caption text for the file
   */
  caption?: string;

  /**
   * Description text for the file
   */
  desc?: string;

  /**
   * Display name of the file
   */
  name?: string;

  /**
   * File size in bytes
   */
  size?: number;

  /**
   * Unique identifier for the file
   */
  id?: number;

  /**
   * Original filename before upload
   */
  realName?: string;

  /**
   * Additional dynamic properties
   */
  [key: string]: unknown;
}

/**
 * DOM element representing a file item
 * Extends HTMLElement with file-specific attributes
 */
export interface FileItemElement extends HTMLElement {
  /**
   * MIME type of the file
   */
  fileType: string;

  /**
   * URL or path of the file
   */
  fileUrl: string;

  /**
   * File size in bytes
   */
  fileSize?: number;

  /**
   * Display name of the file
   */
  fileName?: string;

  /**
   * Caption text
   */
  fileCaption?: string;

  /**
   * Description text
   */
  fileDesc?: string;

  /**
   * Unique file identifier
   */
  fileId?: number;

  /**
   * Thumbnail URL
   */
  thumbnail?: string;
}

/**
 * Options for creating file items
 */
export interface FileCreateOptions {
  /**
   * Additional dynamic properties for file creation
   */
  [key: string]: unknown;
}

/**
 * File block model interface
 * Defines the public API for file block instances
 */
export interface FileBlockModel extends BlockModel {
  /**
   * Get the form container element
   * @returns Form element or null
   */
  getFormElement(): HTMLElement | null;

  /**
   * Get current async task ID
   * @returns Task ID or empty string
   */
  getTaskId(): string | number;

  /**
   * Set current async task ID
   * @param taskId - Task ID to store
   */
  setTaskId(taskId: string | number): void;

  /**
   * Cancel the ongoing async upload process
   * Clears polling timer, sends cancellation request to server,
   * and updates UI accordingly
   */
  cancelAsync(): void;

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
   * Get the AJAX configuration to check the asynchronous file upload status
   * @returns AJAX configuration object for async status polling
   */
  getAsyncCheckerConfig(): AjaxConfig;

  /**
   * Get the AJAX configuration to cancel the asynchronous file upload
   * @returns AJAX configuration object for async cancellation
   */
  getAsyncCancelConfig(): AjaxConfig;

  /**
   * Get input name attribute for file upload
   * @returns Input name string
   */
  getInputName(): string;

  /**
   * Checks if the file name is required
   * @returns True if required, false otherwise
   */
  isRequiredFieldFileName(): boolean;

  /**
   * Checks if the caption is required
   * @returns True if required, false otherwise
   */
  isRequiredFieldCaption(): boolean;

  /**
   * Checks if the description is required
   * @returns True if required, false otherwise
   */
  isRequiredFieldDesc(): boolean;

  /**
   * Checks if the file name is visible
   * @returns True if visible, false otherwise
   */
  isVisibleFieldFileName(): boolean;

  /**
   * Checks if the caption is visible
   * @returns True if visible, false otherwise
   */
  isVisibleFieldCaption(): boolean;

  /**
   * Checks if the description is visible
   * @returns True if visible, false otherwise
   */
  isVisibleFieldDesc(): boolean;

  /**
   * Checks if the image should be rendered
   * @returns True if image rendering is enabled, false otherwise
   */
  isRenderImage(): boolean;

  /**
   * Strategy for saving media files as links
   * When active, files are saved with url and type instead of requiring id
   * @returns Whether the link strategy is active
   */
  isLinkStrategy(): boolean;

  /**
   * Get the upload progress bar element
   * @returns Progress element or null if not created
   */
  getProgressElement(): HTMLElement | null;

  /**
   * Update progress bar percentage
   * Creates progress element if it doesn't exist
   * @param percent - Progress percentage value (0-100)
   */
  progress(percent: number): void;

  /**
   * Remove progress bar from DOM and reset UI state
   * Shows upload label and refreshes counter
   */
  removeProgress(): void;

  /**
   * Refresh block UI state based on current items
   * Updates form visibility and file input state
   */
  refresh(): void;

  /**
   * Refresh counter with current item count
   * @param count - Optional count override, otherwise uses actual items count
   */
  refreshCount(count?: number): void;

  /**
   * Get the counter DOM element
   * @returns Counter element or null
   */
  getCounterElement(): HTMLElement | null;

  /**
   * Get action models associated with file items
   * @returns List of file action model instances
   */
  getFileActions(): FileActionModel[];
}