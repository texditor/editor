import { IconBars } from "@/icons";
import Texditor from "@/texditor";
import { append, make, html, addClass } from "@/utils/dom";
import renderIcon from "@/utils/renderIcon";

export default function ActionsView(editor: Texditor): HTMLElement {
  return make("div", (el: HTMLElement) => {
    const { api } = editor,
      className = api.css("actions", false),
      animateName = api.css("animate", false);

    addClass(el, className);
    append(
      el,
      make("div", (settings: HTMLElement) => {
        addClass(settings, className + "-settings");
        append(
          settings,
          make("div", (btn: HTMLElement) => {
            addClass(btn, className + "-open");
            html(
              btn,
              renderIcon(IconBars, {
                width: 14,
                height: 14
              })
            );
          })
        );
        append(
          settings,
          make("div", (wrap: HTMLElement) => {
            addClass(wrap, className + "-wrap " + animateName + "-fadeIn");
            append(
              wrap,
              make("div", (cnt: HTMLElement) => {
                addClass(cnt, className + "-container");
              })
            );
            append(
              wrap,
              make("div", (cnt: HTMLElement) => {
                addClass(cnt, className + "-menu");
              })
            );
          })
        );
      })
    );
  });
}
