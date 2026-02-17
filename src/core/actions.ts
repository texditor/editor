import type {
  ActionsInterface,
  ActionModelInstanceInterface,
  TexditorInterface
} from '@/types'
import { append, closest, css, make, query } from "@/utils/dom";
import { off, on } from "@/utils/events";
import DeleteAction from "@/actions/delete-action";
import MoveUpAction from "@/actions/moveup-action";
import MoveDownAction from "@/actions/movedown-action";
import CreateAction from "@/actions/create-action";
import ConvertAction from "@/actions/convert-action";

export default class Actions implements ActionsInterface {
  private editor: TexditorInterface;
  private actions: ActionModelInstanceInterface[] = [];

  constructor(editor: TexditorInterface) {
    this.editor = editor;
    this.show = this.show.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.repositionBar = this.repositionBar.bind(this);
    const actions = this.editor.config.get("actions", []) as ActionModelInstanceInterface[];

    if (actions.length) {
      actions.forEach((toolModel: ActionModelInstanceInterface) => {
        this.register(toolModel);
      });
    } else {
      // Register default actions
      this.register(CreateAction);
      this.register(ConvertAction);
      this.register(MoveUpAction);
      this.register(MoveDownAction);
      this.register(DeleteAction);
    }
  }

  render() {
    const { api, events } = this.editor,
      uniqueId = api.getUniqueId();

    events.trigger("actions:render");
    this.hide();
    this.repositionBar();
    on(window, "resize.a" + uniqueId, this.repositionBar);
    on(window, "scroll.a" + uniqueId, this.repositionBar);
    events.trigger("actions:render:end");
  }

  private repositionBar() {
    const { api, blockManager, config } = this.editor,
      curBlock = blockManager.getCurrentBlock(),
      root = api.getRoot(),
      className = api.css("actions", false),
      windowWidth = window.innerWidth;

    if (root && curBlock) {
      query(
        api.css("actions"),
        (el: HTMLElement) => {
          const rect = curBlock.getBoundingClientRect(),
            windowHeight = window.innerHeight,
            elementHeight = el.offsetHeight;

          const leftOffset = windowWidth <= 768 ? 0 : (config.get("actionsLeftOffset", 24) as number),
            offsetTop = windowWidth <= 768 ? 0 : (config.get("actionsTopOffset", 0) as number);

          const setDirecton = (dir: string) => {
            query(
              "." + className + "-settings",
              (settingBlock: HTMLDivElement) => {
                css(settingBlock, {
                  display: "flex",
                  "flex-direction": dir
                });
              },
              el
            );
          };
          let topPosition = rect.top + 1 + offsetTop;
          setDirecton("column");

          if (topPosition + elementHeight > windowHeight) {
            topPosition = rect.top - elementHeight - offsetTop + 12;

            setDirecton("column-reverse");
            if (topPosition < 0) {
              topPosition = 0;
            }
          }

          css(el, "display", "flex");
          css(el, "left", rect.left - leftOffset);
          css(el, "top", topPosition);
        },
        root
      );
    }
  }

  private handleClose(evt: Event) {
    const { api, events } = this.editor,
      root = api.getRoot(),
      cssName = api.css("actions"),
      cssAction = api.css("action");

    if (root && evt.target) {
      let status = false;

      query(
        cssName + "-wrap",
        (el: HTMLElement) => {
          status = !closest(evt.target, el);
        },
        root
      );

      query(
        cssName + "-open",
        (el: HTMLElement) => {
          status = !closest(evt.target, el);
        },
        root
      );

      query(cssName + "-container > " + cssAction + "-confirm", (el: HTMLElement) => el.remove(), root);

      if (status) this.hide();

      events.refresh();
    }
  }

  showMenu(items: HTMLElement[], title: string = "") {
    this.wrap((el: HTMLElement, cssName: string) => {
      if (items) {
        query(
          cssName + "-container",
          (div: HTMLElement) => {
            div.style.display = "none";
          },
          el
        );
        query(
          cssName + "-menu",
          (div: HTMLElement) => {
            if (title) {
              append(
                div,
                make("h4", (header: HTMLHeadingElement) => {
                  header.innerText = title;
                })
              );
            }
            items.forEach((item) => {
              append(div, item);
            });
            div.style.display = "block";
          },
          el
        );
      }
    });
  }

  hideMenu() {
    this.wrap((el: HTMLElement, cssName: string) => {
      query(
        cssName + "-container",
        (div: HTMLElement) => {
          div.style.display = "";
        },
        el
      );
    });
  }

  private wrap(callback: CallableFunction) {
    const { api, events } = this.editor,
      root = api.getRoot(),
      cssName = api.css("actions");

    if (root) {
      query(cssName + " " + cssName + "-wrap", (el: HTMLElement) => callback(el, cssName), root);
    }

    events.refresh();
  }

  show() {
    const { api } = this.editor,
      uniqueId = api.getUniqueId();

    this.wrap((el: HTMLElement) => {
      css(el, "display", "block");
      off(document, "click.actions" + uniqueId);
      on(document, "click.actions" + uniqueId, this.handleClose);
      setTimeout(() => this.repositionBar(), 100);
    });
  }

  hide() {
    this.hideMenu();
    this.wrap((el: HTMLElement, cssName: string) => {
      css(el, "display", "");
      off(document, "click.actions");
      query(
        cssName + " " + cssName + "-menu",
        (div: HTMLElement) => {
          div.innerHTML = "";
          div.style.display = "";
        },
        el
      );
    });
  }

  register(action: ActionModelInstanceInterface) {
    this.actions.push(action);
  }

  apply() {
    const { api } = this.editor,
      root = api.getRoot(),
      cssName = api.css("actions");

    if (root) {
      const actions = this.actions as ActionModelInstanceInterface[];

      actions.forEach((actionConstructor: ActionModelInstanceInterface) => {
        const action = new actionConstructor(this.editor);

        if (action?.create) {
          const actionElement = action.create();

          query(
            cssName + " " + cssName + "-container",
            (el: HTMLElement) => {
              append(el, actionElement);
            },
            root
          );

          if (action?.applyEvents) action.applyEvents();
        }
      });

      query(
        cssName + " " + cssName + "-open",
        (el: HTMLElement) => {
          on(el, "click.a", this.show);
        },
        root
      );
    }
  }

  destroy() {
    const { api } = this.editor,
      uniqueId = api.getUniqueId();
    off(window, "resize.a" + uniqueId);
    off(window, "scroll.a" + uniqueId);
    off(document, "click.actions" + uniqueId);
  }
}
