import { addClass, make } from "@/utils";

export default function BlocksView(): HTMLElement {
  return make("div", (el: HTMLElement) => {
    addClass(el, 'tex-blocks');
  });
}
