import type { TexditorInterface } from "@/types";

export default function BlocksView(editor: TexditorInterface): HTMLElement {
  return editor.blockManager.render();
}
