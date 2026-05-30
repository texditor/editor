import type {
  ExtensionModelConstructor,
  ExtensionModel,
  Extensions as IExtensions,
  Texditor
} from "@/types";

import {
  randString,
  addClass,
  css,
  query,
  removeClass,
  off,
  rebind
} from "snappykit";

export default class Extensions implements IExtensions {
  /** Reference to the main editor instance */
  private editor: Texditor;

  /** Collection of extensions models */
  private extensions: ExtensionModel[] = [];

  /** Unique identifier for event listeners to prevent conflicts */
  private eventId: string = '.ext' + randString(12);

  constructor(editor: Texditor) {
    this.editor = editor;
    const extModels = this.editor.config.get("extensions", []);

    if (extModels && extModels.length) {
      extModels.forEach((instance: ExtensionModelConstructor) => {
        this.extensions.push(new instance(this.editor));
      });
    }
  }

  /** @see IExtensions.getExtensions */
  getExtensions(): ExtensionModel[] {
    return this.extensions;
  }

  /** @see IExtensions.refresh */
  refresh(): void {
    const cssName = 'tex-extension';
    this.getExtensions().forEach((extension) => {
      const node = extension.getElement();
      if (node) {
        if (!extension.isActive()) addClass(node, cssName + "-not-active");
        else removeClass(node, cssName + "-not-active");

        if (!extension.isVisible()) css(node, 'display', 'none');
        else css(node, 'display', '')
      }
    })
  }

  /**
   * Sets up fixed positioning behavior for extensions bar.
   * Attaches scroll, load, and resize event listeners.
   * Makes extensions bar sticky when scrolling past editor.
   */
  __apply(): void {
    const { config } = this.editor;
    const root = this.editor.getRoot(),
      extCss = 'tex-extension',
      className = extCss + 's';

    if (config.get("extensionsFixed", true)) {
      const fixedExtensions = () => {
        if (!root) return;

        query(
          '.tex',
          (rootEditor: HTMLElement) => {
            const scrollTop =
              window.pageYOffset || document.documentElement.scrollTop,
              editorRect = rootEditor.getBoundingClientRect(),
              editorLeft = editorRect.left,
              editorWidth = rootEditor.offsetWidth;

            query(
              "." + className,
              (extEl: HTMLElement) => {
                if (scrollTop >= editorRect.top + scrollTop) {
                  addClass(extEl, className + "-fixed");
                  css(extEl, { left: editorLeft, width: editorWidth });
                  const extCss = config.get("extensionsFixedStyle", false);

                  if (extCss) css(extEl, extCss);
                } else {
                  removeClass(extEl, className + "-fixed");
                  extEl.removeAttribute("style");
                }
              },
              rootEditor
            );
          },
          root
        );
      };

      const eid = this.eventId;

      rebind(window, "scroll" + eid, fixedExtensions);
      rebind(window, "load" + eid, fixedExtensions);
      rebind(window, "resize" + eid, fixedExtensions);
    }
  }

  /** @see IExtensions.destroy */
  destroy() {
    this.extensions.forEach((ext) => ext.destroy());
    const eid = this.eventId;

    off(window, "scroll" + eid);
    off(window, "load" + eid);
    off(window, "resize" + eid);
  }
}