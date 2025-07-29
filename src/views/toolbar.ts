import Texditor from "@/texditor";
import { addClass, append, make } from "@/utils/dom";

export default function ToolbarView(editor: Texditor): HTMLElement {
  const { api } = editor,
    cssName = api.css("toolbar", false);

  return make("div", (el: HTMLDivElement) => {
    addClass(el, cssName);

    append(
      el,
      make("div", (cnt: HTMLDivElement) => {
        addClass(cnt, cssName + "-tools");
      })
    );

    append(
      el,
      make("div", (cnt: HTMLDivElement) => {
        addClass(cnt, cssName + "-content");
      })
    );
  });
}
