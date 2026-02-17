import type {
  ExtensionModelInstanceInterface,
  ExtensionModelInterface,
  ExtensionsInterface,
  TexditorInterface
} from "@/types";
import {
  addClass,
  append,
  css,
  make,
  query,
  queryLength,
  removeClass
} from "@/utils/dom";
import { off, on } from "@/utils/events";

export default class Extensions implements ExtensionsInterface {
  private editor: TexditorInterface;

  constructor(editor: TexditorInterface) {
    this.editor = editor;
  }

  render(): HTMLElement | Node {
    const { api, config, events } = this.editor,
      cssName = api.css("extensions", false),
      extensions = config.get("extensions", []);

    events.trigger("extensions:render");

    if (!extensions?.length) return document.createTextNode("");

    this.fixedBar();

    const extensionsBar = make("div", (el: HTMLDivElement) => {
      const ltr = config.get("extensionsLtr", "left");
      addClass(el, cssName + " tex-" + ltr);

      // Исправление: приведение типа через unknown
      (extensions as unknown as ExtensionModelInstanceInterface[]).forEach(
        (ExtClass: ExtensionModelInstanceInterface) => {
          const extInstance: ExtensionModelInterface = new ExtClass(
            this.editor
          );

          if (extInstance?.create) {
            const element = extInstance.create(),
              groupName = extInstance.getGroupName
                ? extInstance.getGroupName()
                : "";

            if (groupName) {
              const isExists = !!queryLength(
                "." + cssName + "-group-" + groupName,
                el
              );

              if (isExists) {
                query(
                  "." + cssName + "-group-" + groupName,
                  (group: HTMLElement) => {
                    append(group, element);
                  },
                  el
                );
              } else {
                const groupElement = make("div", (group: HTMLElement) => {
                  addClass(
                    group,
                    cssName + "-group-" + groupName + " " + cssName + "-group"
                  );
                  append(group, element);
                });

                append(el, groupElement);
              }
            } else append(el, element);
          }
        }
      );
    });

    events.trigger("extensions:render.end", { el: extensionsBar });

    return extensionsBar;
  }

  fixedBar() {
    const { api, config } = this.editor,
      uniqueId = api.getUniqueId();

    if (config.get("extensionsFixed", true)) {
      const fixedExtensions = () => {
        const root = api.getRoot(),
          className = api.css("extensions", false);

        if (!root) return;

        query(
          api.css("editor"),
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

      off(window, "scroll.ext" + uniqueId);
      off(window, "scroll.ext" + uniqueId);
      off(window, "scroll.ext" + uniqueId);
      on(window, "scroll.ext" + uniqueId, fixedExtensions);
      on(window, "load.ext" + uniqueId, fixedExtensions);
      on(window, "resize.ext" + uniqueId, fixedExtensions);
    }
  }

  destroy() {
    const { api } = this.editor,
      uniqueId = api.getUniqueId();

    off(window, "scroll.ext" + uniqueId);
    off(window, "scroll.ext" + uniqueId);
    off(window, "scroll.ext" + uniqueId);
    off(window, "scroll.ext" + uniqueId);
    off(window, "load.ext" + uniqueId);
    off(window, "resize.ext" + uniqueId);
  }
}
