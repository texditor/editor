import type {
  BlockNode,
  EventsInterface,
  EventTriggerObject,
  TexditorEvent,
  TexditorInterface
} from "@/types";
import { encodeHtmlSpecialChars, generateRandomString } from "@/utils/common";
import { addClass, append, appendText, closest, getChildNodes, getLength, queryList, removeClass } from "@/utils/dom";
import { off, on } from "@/utils/events";
import { hasClass, query } from "@/utils/dom";
import { isEmptyString } from "@/utils/string";

export default class Events implements EventsInterface {
  /** Reference to the main editor instance */
  private editor: TexditorInterface;

  /** Storage for registered event callbacks */
  private triggers: EventTriggerObject = {};

  /** Flag to enable/disable undo/redo keyboard shortcuts */
  private isUndoRedoEnabled: boolean = true;

  /** Unique identifier for event listeners to prevent conflicts */
  private eventId: string = '';

  constructor(editor: TexditorInterface) {
    this.editor = editor;
    this.eventId = generateRandomString(16);
    this.onKeyDownHandle = this.onKeyDownHandle.bind(this);
    this.onKeyUpHandle = this.onKeyUpHandle.bind(this);
    this.onPasteHandle = this.onPasteHandle.bind(this);
    this.onFocusHandle = this.onFocusHandle.bind(this);
    this.onClickHandle = this.onClickHandle.bind(this);
    this.onBlurHandle = this.onBlurHandle.bind(this);
    this.onSelectionChangeHandle = this.onSelectionChangeHandle.bind(this);
    this.handleUndoRedo = this.handleUndoRedo.bind(this);
  }

  /**
   * Adds an event listener with optional identifier
   * @param name - Event name (can include .id suffix)
   * @param callback - Function to call when event triggers
   */
  add(name: string, callback: CallableFunction) {
    const nameOrId = name.split(".");
    const [eventName, eventId] = nameOrId;

    if (!this.triggers[eventName]) this.triggers[eventName] = {};

    if (typeof callback === "function") {
      const id = eventId ? eventId : generateRandomString(16);
      this.triggers[eventName][id] = callback;
    }
  }

  /**
   * Checks if an event listener exists
   * @param name - Event name (can include .id suffix)
   * @returns True if event exists
   */
  exists(name: string) {
    const nameOrId = name.split(".");
    const [eventName, eventId] = nameOrId;

    if (!this.triggers[eventName]) return false;

    if (eventId) {
      if (!this.triggers[eventName][eventId]) return false;
    }

    return true;
  }

  /**
   * Removes an event listener
   * @param name - Event name
   * @param id - Optional specific event ID to remove
   * @returns True if removal was successful
   */
  remove(name: string, id?: string): boolean {
    if (!this.triggers[name]) return false;

    if (id) {
      if (this.triggers[name][id]) {
        delete this.triggers[name][id];
        return true;
      }

      return false;
    }

    delete this.triggers[name];
    return true;
  }

  /**
   * Triggers all callbacks for an event
   * @param name - Event name to trigger
   * @param params - Parameters to pass to callbacks
   */
  trigger(name: string, params: TexditorEvent = {}) {
    if (!this.triggers[name]) return;

    const trigger = this.triggers[name];

    if (typeof trigger === "object") {
      for (const eventId in trigger) {
        trigger[eventId](params);
      }
    }
  }

  /**
   * Refreshes event listeners on all blocks
   */
  refresh() {
    const { actions, blockManager } = this.editor,
      blockContainer = blockManager.getBlocksContainer();

    if (!blockContainer)
      throw new Error("The root element of the editor was not found.");

    query(
      '.tex-block-content',
      (el: HTMLElement) => {
        on(el, "keydown.e", this.onKeyDownHandle);
        on(el, "keyup.e", this.onKeyUpHandle);
        on(el, "paste.e", this.onPasteHandle);
        on(el, "dragstart.e", this.onDragStart);
        on(el, "dragleave.e", this.onDragLeave);
        on(el, "dragover.e", this.onDragOver);
        on(el, "drag.e1", this.onDrag);
        on(el, "drop.e1", this.onDrop);
        on(el, "dragend.e", this.onDragEnd);
        on(el, "focus.e", this.onFocusHandle);
        on(el, "blur.e", this.onBlurHandle);
        on(el, "click.e", this.onClickHandle);
      },
      blockContainer
    );

    on(
      document,
      "selectionchange.e" + this.eventId,
      this.onSelectionChangeHandle
    );
  }

  /**
   * Initializes editor when ready
   * @param callback - Function to call when editor is ready
   */
  onReady(callback: CallableFunction) {
    const { actions, blockManager } = this.editor;

    setTimeout(() => {
      if (callback) callback(this);

      actions.render();
      blockManager.detectEmpty();
      blockManager.normalize();
      this.refresh();
    }, 10);
  }

  /**
   * Handles content change events
   * @param event - Change event data
   */
  change(event: TexditorEvent) {
    const {
      actions,
      blockManager,
      config,
      historyManager
    } = this.editor,
      changeHandle = config.get("onChange", false);

    blockManager.detectEmpty();
    blockManager.normalize();

    if (changeHandle && typeof changeHandle === "function") {
      if (!this.exists("onChange.onReady"))
        this.add("onChange.onReady", changeHandle);
    }

    this.trigger("onChange", event);

    if (
      event.type != "keydown" &&
      event.type != "keyup" &&
      event.type != "historySave"
    ) {
      historyManager.save();
    }

    actions.render();
  }

  /**
   * Handles focus events on blocks
   * @param evt - Focus event
   */
  private onFocusHandle(evt: FocusEvent) {
    this.trigger("focus", { domEvent: evt });
    this.setIndexByTarget(evt.target);
    this.trigger("focusEnd", { domEvent: evt });
  }

  /**
   * Handles click events on blocks
   * @param evt - Mouse event
   */
  private onClickHandle(evt: MouseEvent) {
    this.trigger("click", { domEvent: evt });
    this.setIndexByTarget(evt.target);
    this.trigger("clickEnd", { domEvent: evt });
  }

  /**
   * Handles blur events on blocks
   * @param evt - Focus event
   */
  private onBlurHandle(evt: FocusEvent) {
    evt.preventDefault();
    this.trigger("blur", { domEvent: evt });
  }

  /**
   * Handles keyup events on blocks
   * @param evt - Keyboard event
   */
  private onKeyUpHandle(evt: KeyboardEvent) {
    this.trigger("keyup", { domEvent: evt });
    evt.preventDefault();
    this.setIndexByTarget(evt.target);

    this.change({
      type: "keyup",
      domEvent: evt
    });

    this.trigger("keyupEnd", { domEvent: evt });
    this.editor.historyManager.scheduleSave();
  }

  /**
   * Sets the current block index based on target
   * @param target - Event target
   * @param ignoreToolbar - Whether to skip toolbar rendering
   */
  private setIndexByTarget(target?: EventTarget | null) {
    const { blockManager } = this.editor;
    const targetIndex = blockManager.getIndex(target || undefined, true);

    this.setIndex(targetIndex);
  }

  private setIndex(index: number) {
    const { actions, blockManager } = this.editor;
    const model = blockManager.getModel(index);
    blockManager.use(index);

    if (model?.isEditableItems()) {
      const activeItem = model.getItem(-1);

      if (activeItem) {
        const className = 'tex-item-active',
          items = model.getItems();

        if (items.length) {
          items.forEach((item: HTMLElement) => {
            removeClass(item, className)
          });
          addClass(activeItem, className);
        }
      }
    }
  }

  /**
   * Handles keydown events with special behavior for Enter, Backspace, etc.
   * @param evt - Keyboard event
   */
  private onKeyDownHandle(evt: KeyboardEvent) {
    const { blockManager, historyManager, selectionApi, config, api } = this.editor;

    if (this.handleUndoRedo(evt)) {
      return;
    }

    this.trigger("keydown", { domEvent: evt });

    if (evt.target) {
      blockManager.use(
        blockManager.getIndex(evt.target, true)
      );
    }

    const blocksContainer = blockManager.getBlocksContainer(),
      defBlock = config.get("defaultBlock", "p"),
      model = blockManager.getModel(),
      contentNode = blockManager.getContentNode();

    const breakEvent = () => {
      evt.stopPropagation();
      evt.preventDefault();
    }

    if (!model) {
      breakEvent();
      return;
    }

    const focusedNode = model.isEditableItems() && model.getItemBody(-1)
      ? model.getItemBody(-1)
      : contentNode;

    if (!focusedNode) {
      breakEvent();
      return;
    }

    const [start, end] = selectionApi.getOffset(focusedNode),
      curTextLength = contentNode?.textContent?.length || 0,
      cursorStart = start < 0 ? 0 : start,
      cursorEnd = end < 0 ? 0 : end;

    if (blocksContainer && contentNode) {
      if (api.isEmpty()) blockManager.createBlock(defBlock);

      if (evt.key == "Enter") {
        this.trigger("keydownEnterKey", { domEvent: evt });

        if (closest(evt.target, contentNode)) {
          if (model.isEditableItems()) {
            if (model.isEnterCreate()) {
              breakEvent();

              const itemIndex = model.getItemIndex(),
                isEmptyItem = model.isEmptyItem(itemIndex);

              if (
                isEmptyItem &&
                model.getItemsLength() === itemIndex + 1
              ) {
                model.removeItem(itemIndex);
                blockManager.createBlock(defBlock);
              } else {
                if (
                  !isEmptyItem &&
                  (!model?.isEmptyItem(itemIndex - 1) && cursorStart != 0 && cursorEnd != 0)
                ) {
                  model.createItem(
                    selectionApi.splitContent(
                      model.getItemBody(-1)
                    )
                  );
                }
              }
            }
          } else {
            if (model.isEnterCreate()) {
              breakEvent();

              if (
                (cursorStart === cursorEnd && cursorStart === curTextLength) ||
                cursorStart !== cursorEnd
              ) {
                if (!model.isEmpty())
                  blockManager.createBlock(defBlock);
              } else {
                blockManager.createBlock(defBlock, -1, {
                  content: selectionApi.splitContent(contentNode)
                });
              }
            }
          }
        }

        this.trigger("keydownEnterKeyEnd", { domEvent: evt });
      } else if (evt.key == "Backspace") {
        this.trigger("keydownBackspaceKey", { domEvent: evt });

        if (blockManager.count() > 1) {
          const index = blockManager.getIndex();
          if (
            model.isEditableItems() &&
            model.getItemIndex() > 0 &&
            cursorStart == 0 &&
            cursorEnd == 0
          ) {
            breakEvent();
            const itemChilds = getChildNodes(focusedNode),
              itemIndex = model.getItemIndex();

            const prevItemBody = model.getItemBody(itemIndex - 1);

            if (prevItemBody) {
              const prevLength = getLength(prevItemBody);

              if (prevLength) {
                appendText(prevItemBody, ' ');
                append(prevItemBody, itemChilds);
                blockManager.focus(
                  index,
                  prevLength,
                  prevLength,
                  itemIndex - 1
                );
              } else {
                prevItemBody.focus();
              }

              model.removeItem(itemIndex);
            }
          } else {
            if (blockManager.isEmpty() && model?.isBackspaceRemove()) {
              evt.preventDefault();
              const curIndex = blockManager.removeBlock(-1, true);

              if (curIndex != null) {
                const prevModel = blockManager.getModel(curIndex - 1);
                const prevLength = (prevModel?.getItemsLength() || 1) - 1;

                blockManager.focus(
                  curIndex ? curIndex - 1 : 0,
                  undefined,
                  undefined,
                  prevLength
                );
              }
            } else {
              // Merge if not an empty block
              if (
                cursorStart === 0 &&
                cursorEnd === 0 &&
                model?.isBackspaceRemove()
              ) {
                const pervIndex = index - 1;

                evt.preventDefault();
                blockManager.merge(index, pervIndex, pervIndex);
              }
            }
          }
        }

        this.trigger("keydownBackspaceKeyEnd", { domEvent: evt });
      }
    }

    this.trigger("keydownEnd", { domEvent: evt });
    this.change({
      type: "keydown",
      event: evt
    });

    if (
      evt.key === "Enter" ||
      evt.key === "Backspace" ||
      evt.key === "Delete"
    ) {
      historyManager.save();
    } else {
      historyManager.scheduleSave();
    }
  }

  /**
   * Handles undo/redo keyboard shortcuts
   * @param evt - Keyboard event
   * @returns True if undo/redo was handled
   */
  private handleUndoRedo(evt: KeyboardEvent): boolean {
    if (!this.isUndoRedoEnabled) return false;

    const { ctrlKey, shiftKey, metaKey, code } = evt,
      isCommand = metaKey;

    // Ctrl+Z | Cmd+Z - Undo
    if ((ctrlKey || isCommand) && !shiftKey && code === "KeyZ") {
      evt.preventDefault();
      this.performUndo();
      return true;
    }

    // Ctrl+Shift+Z | Cmd+Shift+Z - Redo
    if ((ctrlKey || isCommand) && shiftKey && code === "KeyZ") {
      evt.preventDefault();
      this.performRedo();
      return true;
    }

    // Ctrl+Y - Redo
    if ((ctrlKey || isCommand) && !shiftKey && code === "KeyY") {
      evt.preventDefault();
      this.performRedo();
      return true;
    }

    return false;
  }

  /**
   * Performs undo operation
   */
  private performUndo(): void {
    this.trigger("undo", { type: "undo" });

    const { historyManager } = this.editor;
    if (historyManager && typeof historyManager.undo === "function") {
      historyManager.undo();
    }
  }

  /**
   * Performs redo operation
   */
  private performRedo(): void {
    this.trigger("redo", { type: "undo" });

    const { historyManager } = this.editor;
    if (historyManager && typeof historyManager.redo === "function") {
      historyManager.redo();
    }
  }

  /**
   * Enables or disables undo/redo keyboard shortcuts
   * @param enabled - Whether undo/redo should be enabled
   */
  public setUndoRedoEnabled(enabled: boolean): void {
    this.isUndoRedoEnabled = enabled;
  }

  /**
   * Handles paste events with smart content parsing
   * @param evt - Clipboard event
   */
  private onPasteHandle(evt: ClipboardEvent) {
    const { config, parser, blockManager, selectionApi, historyManager } =
      this.editor;

    this.trigger("onPaste", { domEvent: evt });

    if (!evt.clipboardData) return;

    const defBlock = config.get("defaultBlock", "p"),
      currentModel = blockManager.getModel();

    if (
      currentModel &&
      "onPaste" in currentModel &&
      typeof currentModel.onPaste === "function"
    ) {
      const pasteData = evt.clipboardData.getData("text/html") || "";
      const input = parser.parseHtml(pasteData, true);
      currentModel?.onPaste(evt, input);
    } else {
      evt.preventDefault();

      const pasteData = evt.clipboardData.getData("text/html") || "";
      const input = parser.parseHtml(pasteData, true);
      const isBlockPaste = !!Array.from(input?.childNodes || []).filter(
        (item) =>
          item.nodeType == 1 &&
          blockManager.getRealType((item as HTMLElement).localName)
      ).length;

      if (input && isBlockPaste) {
        let reversedNodes: Node[] = [],
          isCreateBlocks = false;

        input?.childNodes.forEach((item: Node) => {
          reversedNodes.push(item);

          if (item.nodeType === Node.ELEMENT_NODE) {
            const element = item as Element;
            if (blockManager.getRealType(element.localName))
              isCreateBlocks = true;
          }
        });

        if (isCreateBlocks) reversedNodes = reversedNodes.reverse();

        reversedNodes.forEach((item: Node) => {
          if (isCreateBlocks) {
            if (item.nodeType === Node.TEXT_NODE) {
              if (!isEmptyString(item?.textContent || "")) {
                blockManager.createBlock(defBlock, -1, {
                  content: item?.textContent || ""
                });
              }
            } else if (item.nodeType === Node.ELEMENT_NODE) {
              const tagName = item.nodeName.toLowerCase(),
                realName =
                  blockManager.getRealType(tagName) ||
                  blockManager.getRealType(defBlock) ||
                  "p";

              if (realName) {
                const html = (item as Element)?.innerHTML;
                if (!isEmptyString(html)) {
                  blockManager.createBlock(realName, -1, {
                    content: html
                  });
                }
              }
            }
          }
        });

        blockManager.detectEmpty();
      } else {
        const plainText = evt.clipboardData.getData("text/plain");

        selectionApi.insertText(encodeHtmlSpecialChars(plainText));
      }
    }

    this.change({
      type: "paste",
      event: evt
    });

    currentModel?.sanitize();
    this.trigger("onPasteEnd", { domEvent: evt });
    historyManager.save();
  }

  /**
   * Handles drag start events
   * @param evt - Drag event
   */
  private onDragStart(evt: DragEvent): void {
    evt.preventDefault();
  }

  /**
   * Handles drag leave events
   * @param evt - Drag event
   */
  private onDragLeave(evt: DragEvent) {
    evt.preventDefault();
  }

  /**
   * Handles drag over events
   * @param evt - Drag event
   */
  private onDragOver(evt: DragEvent) {
    evt.preventDefault();
  }

  /**
   * Handles drag events
   * @param evt - Drag event
   */
  private onDrag(evt: DragEvent) {
    evt.preventDefault();
  }

  /**
   * Handles drop events
   * @param evt - Drag event
   */
  private onDrop(evt: DragEvent) {
    evt.preventDefault();
  }

  /**
   * Handles drag end events
   * @param evt - Drag event
   */
  private onDragEnd(evt: DragEvent): void {
    evt.preventDefault();
  }

  /**
   * Handles selection change events
   * Updates toolbar and actions based on current selection
   * @param evt - Event
   */
  private onSelectionChangeHandle(evt: Event) {
    const {
      api,
      actions,
      blockManager,
      selectionApi,
      toolbar
    } = this.editor,
      root = api.getRoot();

    if (root) {
      this.trigger("onSelectionChange", { domEvent: evt });

      query(
        '.tex-block',
        (el: BlockNode) => {
          const range = selectionApi.getRange();

          if (range) {
            const focusedBlock = closest(range?.commonAncestorContainer, el);

            if (focusedBlock) {
              const index = blockManager.getIndex(focusedBlock),
                model = blockManager.getModel(index),
                contentNode = model?.getContentNode(),
                blockItem = model?.isEditableItems()
                  ? model.getItemBody(-1)
                  : null;


              this.setIndex(index);
              actions.render();

              const element = blockItem || contentNode,
                [start, end] = selectionApi.getOffset(element);

              if (element) {
                selectionApi.setCurrent(element, {
                  start: start,
                  end: end
                });
              }

              toolbar.highlightActiveTools();

              const range = selectionApi.getRange();

              if (range && !range.collapsed && model?.isToolbar()) {
                toolbar.show();
                this.trigger("onSelectionChangeToolbarShow", {
                  domEvent: evt,
                  range: range
                });
              } else {
                this.trigger("onSelectionChangeToolbaHide", {
                  domEvent: evt,
                  range: range
                });
                toolbar.hide();
              }
            }
          }
        },
        root
      );

      this.trigger("onSelectionChangeEnd", { domEvent: evt });
    }
  }

  /**
   * Destroys the events manager and cleans up all listeners
   */
  destroy(): void {
    const { api } = this.editor;
    const root = api.getRoot();

    if (!root) return;

    query(
      '.tex-block',
      (el: HTMLElement) => {
        off(el, "keydown.e");
        off(el, "keyup.e");
        off(el, "paste.e");
        off(el, "dragstart.e");
        off(el, "dragleave.e");
        off(el, "dragover.e");
        off(el, "drag.e1");
        off(el, "drop.e1");
        off(el, "dragend.e");
        off(el, "focus.e");
        off(el, "blur.e");
        off(el, "click.e");
      },
      root
    );

    off(document, "selectionchange.e" + this.eventId);
    this.triggers = {};
  }
}