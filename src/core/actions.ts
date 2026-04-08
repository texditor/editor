import type {
  ActionsInterface,
  ActionModelConstructor,
  TexditorInterface,
  BlockNode,
  ActionModelInterface
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
  /** Reference to the main editor instance for accessing editor services and state */
  private editor: TexditorInterface;

  /** Collection of action models that define available operations for blocks */
  private actions: ActionModelInterface[] = [];

  /** Unique identifier for event listeners to prevent conflicts with other event handlers */
  private eventId: string = '.actions' + generateRandomString(16);

  /**
   * Initializes the Actions manager with the editor instance and default actions
   * @param editor - The Texditor editor instance
   */
  constructor(editor: TexditorInterface) {
    this.editor = editor;
    this.show = this.show.bind(this);
    this.handleClose = this.handleClose.bind(this);

    const actions = this.editor.config.get(
      "actions",
      []
    ) as ActionModelConstructor[];

    const actionModels = actions.length ? actions : [
      CreateAction,
      ConvertAction,
      MoveUpAction,
      MoveDownAction,
      DeleteAction
    ]

    actionModels.forEach((instance: ActionModelConstructor) => {
      this.actions.push(new instance(this.editor));
    })
  }

  /**
   * Retrieves all available action models
   * @returns Array of action model instances
   */
  getActions(): ActionModelInterface[] {
    return this.actions;
  }

  /**
   * Handles closing of the action menu when clicking outside the action area
   * @param evt - The click event that triggered the close
   */
  private handleClose(evt: Event) {
    const { blockManager, events } = this.editor,
      blockNode = blockManager.getBlockNode(),
      cssAction = '.tex-action',
      cssName = cssAction + "s";

    if (blockNode && evt.target) {
      let status = false;

      query(
        cssName + "-wrap",
        (el: HTMLElement) => {
          status = !closest(evt.target, el);
        },
        blockNode
      );

      query(
        cssName + "-open",
        (el: HTMLElement) => {
          status = !closest(evt.target, el);
        },
        blockNode
      );

      query(cssAction + "-confirm",
        (el: HTMLElement) => el.remove(),
        blockNode
      );

      query(cssAction + "-verifiable",
        (el: HTMLElement) => css(el, 'display', ''),
        blockNode
      );

      if (status) this.hide();

      events.refresh();
    }
  }

  /**
   * Displays a custom menu with specified items
   * @param items - Array of HTML elements to display in the menu
   * @param title - Optional title for the menu
   */
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

  /**
   * Hides the currently displayed menu
   */
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

  /**
   * Executes a callback function within the context of the current block's action container
   * @param callback - Function to execute with the action container element and CSS class name
   */
  private wrap(callback: CallableFunction) {
    const { blockManager, events } = this.editor,
      blockNode = blockManager.getBlockNode(),
      cssName = ".tex-actions";

    if (blockNode) {
      query(
        cssName + " " + cssName + "-wrap",
        (el: HTMLElement) => callback(el, cssName),
        blockNode
      );
    }

    events.refresh();
  }

  /**
   * Displays the actions panel for the current block
   */
  show() {
    this.wrap((el: HTMLElement) => {
      css(el, "display", "block");
      rebind(document, "click" + this.eventId, this.handleClose);
    });
  }

  /**
   * Hides the actions panel and cleans up associated event listeners
   */
  hide() {
    this.hideMenu();
    this.wrap((el: HTMLElement, cssName: string) => {
      css(el, "display", "");
      off(document, "click" + this.eventId);
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

  /**
   * Creates and renders action buttons for a specific block node
   * @param blockNode - The block node to attach actions to
   */
  create(blockNode: BlockNode) {
    this.removeActionElements();
    prepend(blockNode, ActionsView(this.editor));
  }

  /**
   * Removes all action elements from the current block
   */
  removeActionElements() {
    const { blockManager } = this.editor,
      container = blockManager.getBlocksContainer();

    if (container) {
      query('.tex-actions', (el: HTMLElement) => {
        off(el, "click.open");
        el.remove();
      }, container)
    }
  }

  /**
   * Cleans up all action elements and event listeners
   */
  destroy() {
    this.actions.forEach((action) => action.destroy());
    this.removeActionElements();
    off(document, "click" + this.eventId);
  }
}