import type {
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
import { off, on, rebind } from "@/utils/events";

export default class Extensions implements ExtensionsInterface {
  /** Reference to the main editor instance */
  private editor: TexditorInterface;

  /** Unique identifier for event listeners to prevent conflicts */
  private eventId: string = '';

  constructor(editor: TexditorInterface) {
    this.editor = editor;
    this.eventId = generateRandomString(12);
  }

  /**
   * Sets up fixed positioning behavior for extensions bar
   * Attaches scroll, load, and resize event listeners
   * Makes extensions bar sticky when scrolling past editor
   */
  apply() {
    const { api, config } = this.editor;
    const root = api.getRoot(),
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

      const eid = '.ext' + this.eventId;

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
    const eid = '.ext' + this.eventId;

    off(window, "scroll" + eid);
    off(window, "load" + eid);
    off(window, "resize" + eid);
  }
}