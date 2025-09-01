import Texditor from "@/texditor";

export default function ExtensionsView(editor: Texditor): HTMLElement | Node {
  return editor.extensions.render();
}
