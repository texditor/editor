import Texditor from "@/texditor";

export default function BlocksView(editor: Texditor): HTMLElement {
  return editor.blockManager.render();
}
