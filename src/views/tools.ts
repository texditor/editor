import { addClass, append, make } from "snappykit";

export default function ToolsView(): HTMLElement {
  const cssName = "tex-tools";

  return make("div", (el: HTMLDivElement) => {
    addClass(el, cssName);

    append(
      el,
      make(
        "div",
        (cnt: HTMLDivElement) => addClass(cnt, cssName + "-list")
      )
    );

    append(
      el,
      make(
        "div",
        (cnt: HTMLDivElement) => addClass(cnt, cssName + "-content")
      )
    );
  });
}
