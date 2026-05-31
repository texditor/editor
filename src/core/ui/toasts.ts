import { ToastOptions, Toasts as IToasts } from '@/types';
import { addClass, after, append, before, getChildNodes, html, make, prepend, remove } from 'snappykit';

export default class Toasts implements IToasts {
  private toastsNode: HTMLElement | null = null;
  private defaultClassName: string;
  private defaultTimeout: number;
  private defaultParent: Element | null;
  private defaultInsertType: 'prepend' | 'append' | 'before' | 'after';
  private activeToast: HTMLElement | null = null;

  constructor(
    defaultParent?: Element | null,
    className: string = 'toasts-container',
    defaultTimeout: number = 3000,
    defaultInsertType: 'prepend' | 'append' | 'before' | 'after' = 'prepend',
  ) {
    this.defaultParent = defaultParent || null;
    this.defaultClassName = className;
    this.defaultTimeout = defaultTimeout;
    this.defaultInsertType = defaultInsertType;
  }

  /**
   * Displays a toast notification with the given message and options.
   * Creates a container if one doesn't exist and handles automatic cleanup
   * when all toasts are removed.
   */
  add(message: string, options: ToastOptions = {}): void {
    const {
      code = 'error',
      parent,
      insertType = this.defaultInsertType,
      className,
      timeout = this.defaultTimeout,
      scrollIntoView = true,
      single = false,
    } = options;

    if (single && this.activeToast) {
      this.activeToast.remove();
      this.activeToast = null;
    }

    if (single && this.toastsNode) {
      const existingToasts = getChildNodes(this.toastsNode);
      if (existingToasts.length > 0) {
        existingToasts.forEach((toast) => (toast as HTMLElement).remove());
      }
    }

    if (!this.toastsNode) {
      this.toastsNode = this.createToasts(className || this.defaultClassName);
    }

    const messageBlock = make('div', (msg: HTMLDivElement) => {
      addClass(msg, 'tex-animate-fadeIn tex-message tex-message-' + code);
      html(msg, message);
    });

    append(this.toastsNode, messageBlock);

    if (single) {
      this.activeToast = messageBlock;
    }

    setTimeout(() => {
      messageBlock.remove();
      if (single && this.activeToast === messageBlock) {
        this.activeToast = null;
      }
    }, timeout);

    const targetParent = parent || this.defaultParent || document.body;

    switch (insertType) {
      case 'prepend':
        prepend(targetParent, this.toastsNode);
        break;
      case 'append':
        append(targetParent, this.toastsNode);
        break;
      case 'before':
        before(targetParent, this.toastsNode);
        break;
      case 'after':
        after(targetParent, this.toastsNode);
        break;
      default:
        prepend(targetParent, this.toastsNode);
    }

    if (scrollIntoView && this.toastsNode) {
      this.toastsNode.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }

    const observer = new MutationObserver(() => {
      if (this.toastsNode && getChildNodes(this.toastsNode).length === 0) {
        observer.disconnect();
        remove(this.toastsNode);
        this.toastsNode = null;
        this.activeToast = null;
      }
    });

    observer.observe(this.toastsNode, { childList: true });
  }

  /**
   * Removes all active toast notifications immediately
   * and cleans up the container element.
   */
  clear(): void {
    if (this.toastsNode) {
      remove(this.toastsNode);
      this.toastsNode = null;
      this.activeToast = null;
    }
  }

  private createToasts(className: string): HTMLElement {
    return make('div', (el: HTMLDivElement) => {
      addClass(el, className);
    });
  }
}
