import { IconBars } from "@/icons";
import { append, make, html, addClass } from "@/utils/dom";
import { renderIcon } from "@/utils/icon";

export default function ActionsView(): HTMLElement {
  return make("div", (el: HTMLElement) => {
    const className = "tex-actions";

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
            addClass(wrap, className + "-wrap " + "tex-animate-fadeIn");
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
