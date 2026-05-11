import type {
  ExtensionModelConstructor,
  ExtensionModelInterface,
  ExtensionsInterface,
  TexditorInterface
} from "@/types";
import { generateRandomString } from "@/utils";
import {
  addClass,
  css,
  query,
  removeClass
} from "@/utils/dom";
import { off, rebind } from "@/utils/events";

export default class Extensions  {
  /** Reference to the main editor instance */
  private editor: TexditorInterface;

  /** Collection of extensions models */
  private extensions: ExtensionModelInterface[] = [];

  /** Unique identifier for event listeners to prevent conflicts */
  private eventId: string = '.ext' + generateRandomString(12);

  constructor(editor: TexditorInterface) {
    this.editor = editor;
    const extModels = this.editor.config.get("extensions", []);

    if (extModels && extModels.length) {
      extModels.forEach((instance: ExtensionModelConstructor) => {
        this.extensions.push(new instance(this.editor));
      });
    }
  }

  getExtensions(): ExtensionModelInterface[] {
    return this.extensions;
  }

  refresh() {
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
   * Sets up fixed positioning behavior for extensions bar
   * Attaches scroll, load, and resize event listeners
   * Makes extensions bar sticky when scrolling past editor
   */
  apply() {
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

  /**
   * Destroys the extensions manager
   * Removes all event listeners and cleans up
   */
  destroy() {
    this.extensions.forEach((ext) => ext.destroy());
    const eid = this.eventId;

    off(window, "scroll" + eid);
    off(window, "load" + eid);
    off(window, "resize" + eid);
  }
}