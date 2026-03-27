import type {
  ActionsInterface,
  ActionModelInstanceInterface,
  TexditorInterface,
  BlockNode
} from "@/types";
import { append, closest, css, html, make, prepend, query } from "@/utils/dom";
import { off, rebind } from "@/utils/events";
import DeleteAction from "@/actions/delete-action";
import MoveUpAction from "@/actions/moveup-action";
import MoveDownAction from "@/actions/movedown-action";
import CreateAction from "@/actions/create-action";
import ConvertAction from "@/actions/convert-action";
import { generateRandomString } from "@/utils";
import ActionsView from "@/views/actions";

export default class Actions implements ActionsInterface {
  private editor: TexditorInterface;
  private actions: ActionModelInstanceInterface[] = [];
  /** Unique identifier for event listeners to prevent conflicts */
  private eventId: string = '';

  constructor(editor: TexditorInterface) {
    this.editor = editor;
    this.show = this.show.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.eventId = generateRandomString(16);
    const actions = this.editor.config.get(
      "actions",
      []
    ) as ActionModelInstanceInterface[];

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

  private handleClose(evt: Event) {
    const { api, events } = this.editor,
      root = api.getRoot(),
      cssName = '.tex-actions',
      cssAction = '.tex-action';

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

      query(cssAction + "-confirm",
        (el: HTMLElement) => el.remove(),
        root
      );

      query(cssAction + "-verifiable",
        (el: HTMLElement) => css(el, 'display', ''),
        root
      );

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
            css(div, 'display', 'none');
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
            css(div, 'display', 'block');
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
          css(div, 'display', '');
        },
        el
      );
    });
  }

  private wrap(callback: CallableFunction) {
    const { api, events } = this.editor,
      root = api.getRoot(),
      cssName = ".tex-actions";

    if (root) {
      query(
        cssName + " " + cssName + "-wrap",
        (el: HTMLElement) => callback(el, cssName),
        root
      );
    }

    events.refresh();
  }

  show() {
    this.wrap((el: HTMLElement) => {
      css(el, "display", "block");
      rebind(document, "click.actions" + this.eventId, this.handleClose);
    });
  }

  hide() {
    this.hideMenu();
    this.wrap((el: HTMLElement, cssName: string) => {
      css(el, "display", "");
      off(document, "click.actions" + this.eventId);
      query(
        cssName + " " + cssName + "-menu",
        (div: HTMLElement) => {
          html(div, '')
          css(div, 'display', '');
        },
        el
      );
    });
  }

  register(action: ActionModelInstanceInterface) {
    this.actions.push(action);
  }

  create(blockNode: BlockNode) {
    const { api } = this.editor,
      root = api.getRoot(),
      cssName = ".tex-actions";

    this.removeActions();

    if (root) {
      prepend(blockNode, ActionsView(this.editor));

      const actions = this.actions;

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

          const node = action.getNode();

          if (node) {
            css(
              node,
              'display',
              !action.isVisible() ? "none" : ""
            );
          }

          if (action?.applyEvents) action.applyEvents();
        }
      });
    }
  }

  private removeActions() {
    const { blockManager } = this.editor,
      container = blockManager.getBlocksContainer();

    if (container) {
      query('.tex-actions', (actions: HTMLElement) => {
        off(actions, "click.open");
        actions.remove();
      }, container)
    }
  }

  destroy() {
    this.removeActions();
    off(document, "click.actions" + this.eventId);
  }
}
