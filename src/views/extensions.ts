import type { TexditorInterface } from "@/types";

export default function ExtensionsView(editor: TexditorInterface): HTMLElement | Node {
  return editor.extensions.render();
}
