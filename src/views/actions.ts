import { IconBars } from "@/icons";
import { TexditorInterface } from "@/types";
import { executeMethodIfExists, on } from "@/utils";
import { append, make, html, addClass, css } from "@/utils/dom";
import { renderIcon } from "@/utils/icon";

export default function ActionsView(editor: TexditorInterface): HTMLElement {
  const { actions } = editor;
  const actionList = actions.getActions();

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
            on(btn, 'click.open', actions.show)
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
                actionList.forEach((action) => {
                  const actionEl = action.getNode();
                  append(cnt, actionEl);
                  css(actionEl, 'display', !action.isVisible() ? "none" : "");
                  executeMethodIfExists(action, '__onMount', [actionEl]);
                })
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
