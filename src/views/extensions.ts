import Texditor from "@/texditor";
import { ExtensionModelInstanceInterface } from "@/types/core/models";
import { addClass, append, css, make, query, removeClass } from "@/utils/dom";
import { off, on } from "@/utils/events";

export default function ExtensionsView(editor: Texditor): HTMLElement | Node {
  const { api, config } = editor,
    cssName = api.css("extensions", false),
    extensions = config.get("extensions", []);

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
          } else {
            removeClass(extEl, className + "-fixed");
            css(extEl, { left: "", width: "" });
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

  if (!extensions?.length) return document.createTextNode("");

  return make("div", (el: HTMLDivElement) => {
    const ltr = config.get("extensionsLtr", "left");
    addClass(el, cssName + " tex-" + ltr);

    (extensions as ExtensionModelInstanceInterface[]).forEach((ext: ExtensionModelInstanceInterface) => {
      const extInstance = new ext(editor);
      if (extInstance?.create) {
        append(el, extInstance?.create());
      }
    });
  });
}
