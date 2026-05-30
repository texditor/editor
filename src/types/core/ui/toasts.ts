/**
 * Options for configuring a toast notification.
 */
export interface ToastOptions {
  /**
   * The status code determining the toast's appearance (e.g., 'error', 'success', 'warning', 'info').
   * @default 'error'
   */
  code?: string;

  /**
   * The parent element where the toast container will be inserted.
   * If not provided, uses the default parent from constructor or document.body.
   */
  parent?: Element;

  /**
   * The insertion method for placing the toast container relative to the parent element.
   * Uses snappykit DOM manipulation methods.
   * @default 'prepend'
   */
  insertType?: 'prepend' | 'append' | 'before' | 'after';

  /**
   * Custom CSS class name for the toast container.
   * Overrides the default class name set in the constructor.
   */
  className?: string;

  /**
   * Duration in milliseconds before the toast is automatically removed.
   * @default 3000
   */
  timeout?: number;

  /**
   * Whether to scroll the toast into view after insertion.
   * @default true
   */
  scrollIntoView?: boolean;
}

/**
 * Public interface for the Toasts class.
 * Defines the contract for toast notification management.
 */
export interface Toasts {
  /**
   * Displays a toast notification with the given message and options.
   * @param message - The text content to display in the toast.
   * @param options - Configuration options for the toast.
   */
  add(message: string, options?: ToastOptions): void;

  /**
   * Removes all active toast notifications and cleans up the container.
   */
  clear(): void;
}
