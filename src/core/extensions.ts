import Texditor from "@/texditor";
import { addClass, append, css, make, query, queryLength, removeClass } from "@/utils/dom";
import { off, on } from "@/utils/events";
import { ExtensionModelInstanceInterface } from "@/types/core/models";

export default class Extensions {
  private editor: Texditor;

  constructor(editor: Texditor) {
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

      (extensions as ExtensionModelInstanceInterface[]).forEach((ext: ExtensionModelInstanceInterface) => {
        const extInstance = new ext(this.editor);
        if (extInstance?.create) {
          const element = extInstance?.create(),
            groupName = extInstance?.getGroupName ? extInstance.getGroupName() : "";

          if (groupName) {
            const isExists = !!queryLength("." + cssName + "-group-" + groupName, el);

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
                addClass(group, cssName + "-group-" + groupName + " " + cssName + "-group");
                append(group, element);
              });

              append(el, groupElement);
            }
          } else append(el, element);
        }
      });
    });

    events.trigger("extensions:render.end", extensionsBar);

    return extensionsBar;
  }

  fixedBar() {
    const { api, config } = this.editor;

    if (config.get("extensionsFixed", true)) {
      const fixedExtensions = () => {
        const root = api.getRoot(),
          className = api.css("extensions", false);

        if (!root) return;

        query(
          api.css("editor"),
          (rootEditor: HTMLElement) => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop,
              editorRect = rootEditor.getBoundingClientRect(),
              editorLeft = editorRect.left,
              editorWidth = rootEditor.offsetWidth;

            query("." + className, (extEl: HTMLElement) => {
              if (scrollTop >= editorRect.top + scrollTop) {
                addClass(extEl, className + "-fixed");
                css(extEl, { left: editorLeft, width: editorWidth });
                const extCss = config.get("extensionsFixedCss", false);

                if (extCss) css(extEl, extCss);
              } else {
                removeClass(extEl, className + "-fixed");
                extEl.removeAttribute("style");
              }
            });
          },
          root
        );
      };

      off(window, "scroll.ext");
      off(window, "scroll.ext");
      off(window, "scroll.ext");
      on(window, "scroll.ext", fixedExtensions);
      on(window, "load.ext", fixedExtensions);
      on(window, "resize.ext", fixedExtensions);
    }
  }
}
