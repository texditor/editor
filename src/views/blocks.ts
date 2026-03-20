import type { TexditorInterface } from "@/types";
import { addClass, make } from "@/utils";

export default function BlocksView(editor: TexditorInterface): HTMLElement {
  return make("div", (el: HTMLElement) => {
    addClass(el, 'tex-blocks');
  });
}
