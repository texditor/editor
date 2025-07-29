import { addClass, append, make } from "@/utils/dom";
import Texditor from "@/texditor";
import ToolbarView from "./toolbar";
import BlocksView from "./blocks";
import ControlsView from "./actions";

export default function MainView(editor: Texditor): HTMLElement {
  return make("div", (el: HTMLElement) => {
    addClass(el, "tex");
    append(el, [ToolbarView(editor), BlocksView(editor), ControlsView(editor)]);
  });
}
