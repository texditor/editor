import type { TexditorInterface } from "@/types";
import { addClass, append, make } from "@/utils/dom";
import ToolsView from "./tools";
import BlocksView from "./blocks";
import ExtensionsView from "./extensions";

export default function MainView(editor: TexditorInterface): HTMLElement {
  return make("div", (el: HTMLElement) => {
    addClass(el, "tex");
    append(el, [
      ExtensionsView(editor),
      ToolsView(),
      make('div', (wrap: HTMLDivElement) => {
        addClass(wrap, 'tex-wrap');
        append(wrap, BlocksView())
      }),
    ]);
  });
}
