import Texditor from "@/texditor";
import { EventTriggerObject } from "@/types/core";
import { generateRandomString } from "@/utils/common";
import { closest } from "@/utils/dom";
import { on } from "@/utils/events";
import { hasClass, query } from "@/utils/dom";
import { isEmptyString } from "@/utils/string";

export default class Events {
  private editor: Texditor;
  private triggers: EventTriggerObject = {};
  private isUndoRedoEnabled: boolean = true;

  constructor(editor: Texditor) {
    this.editor = editor;
    this.onKeyDownHandle = this.onKeyDownHandle.bind(this);
    this.onKeyUpHandle = this.onKeyUpHandle.bind(this);
    this.onPasteHandle = this.onPasteHandle.bind(this);
    this.onFocusHandle = this.onFocusHandle.bind(this);
    this.onClickHandle = this.onClickHandle.bind(this);
    this.onBlurHandle = this.onBlurHandle.bind(this);
    this.onSelectionChangeHandle = this.onSelectionChangeHandle.bind(this);
    this.handleUndoRedo = this.handleUndoRedo.bind(this);
  }

  add(name: string, callback: CallableFunction) {
    const nameOrId = name.split(".");
    const [eventName, eventId] = nameOrId;

    if (!this.triggers[eventName]) this.triggers[eventName] = {};

    if (typeof callback === "function") {
      if (eventId) {
        this.triggers[eventName][eventId] = callback;
      } else {
        this.triggers[eventName][generateRandomString(10)] = callback;
      }
    }
  }

  exists(name: string) {
    const nameOrId = name.split(".");
    const [eventName, eventId] = nameOrId;

    if (!this.triggers[eventName]) return false;

    if (eventId) {
      if (!this.triggers[eventName][eventId]) return false;
    }

    return true;
  }

  remove(name: string, id?: string): boolean {
    if (!this.triggers[name]) return false;

    if (id !== undefined && this.triggers[name][id]) {
      delete this.triggers[name][id];
      return true;
    }

    delete this.triggers[name];
    return true;
  }

  trigger(name: string, ...data: unknown[]) {
    if (!this.triggers[name]) return;

    const trigger = this.triggers[name];

    if (typeof trigger === "object") {
      for (const eventId in trigger) {
        trigger[eventId](...data);
      }
    }
  }

  refresh() {
    const { blockManager, api } = this.editor,
      blockContainer = blockManager.getContainer();

    if (!blockContainer) throw new Error("The root element of the editor was not found.");

    query(
      api.css("block"),
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

    on(document, "selectionchange.e", this.onSelectionChangeHandle);
  }

  onReady(callback: CallableFunction) {
    const { actions, blockManager } = this.editor;

    setTimeout(() => {
      if (callback) callback(this);

      actions.render();
      blockManager.detectEmpty();
      blockManager.normalize();
      this.refresh();
    }, 50);
  }

  change(...data: unknown[]) {
    const { config, actions, blockManager } = this.editor,
      changeHandle = config.get("onChange", false);

    blockManager.detectEmpty();
    blockManager.normalize();

    if (changeHandle && typeof changeHandle === "function") {
      if (!this.exists("onChange.onReady")) this.add("onChange.onReady", changeHandle);
    }

    this.trigger("onChange", this.editor, ...data);
    actions.render();
  }

  private onFocusHandle(evt: FocusEvent) {
    this.trigger("focus", evt);
    this.setIndex(evt.target);
    this.trigger("focusEnd", evt);
  }

  private onClickHandle(evt: MouseEvent) {
    this.trigger("click", evt);
    this.setIndex(evt.target);
    this.trigger("clickEnd", evt);
  }

  private onBlurHandle(evt: FocusEvent) {
    evt.preventDefault();
    this.trigger("blur", evt);
  }

  private onKeyUpHandle(evt: KeyboardEvent) {
    this.trigger("keyup", evt);
    evt.preventDefault();
    this.setIndex(evt.target);
    this.change({
      type: "keyup",
      event: evt
    });
    this.trigger("keyupEnd", evt);
    this.editor.historyManager.scheduleSave();
  }

  private setIndex(target: EventTarget | null, ignoreToolbar = false) {
    const { blockManager, actions } = this.editor;

    blockManager.setIndex(blockManager.getElementIndex(target, true));

    if (!ignoreToolbar) setTimeout(() => actions.render(), 30);
  }

  private onKeyDownHandle(evt: KeyboardEvent) {
    const { blockManager, selectionApi, config, api } = this.editor;

    if (this.handleUndoRedo(evt)) {
      return;
    }

    this.trigger("keydown", evt);

    blockManager.setIndex(blockManager.getElementIndex(evt.target, true));

    const blocksContainer = blockManager.getContainer(),
      defBlock = config.get("defaultBlock", "p"),
      [start, end] = selectionApi.getOffset(),
      curModel = blockManager.getModel(),
      cursorStart = start < 0 ? 0 : start,
      cursorEnd = end < 0 ? 0 : end;

    if (blocksContainer) {
      if (api.isEmpty()) blockManager.createBlock(defBlock);

      if (evt.key == "Enter") {
        this.trigger("keydownEnterKey", evt);

        if (hasClass(evt.target, "tex-block")) {
          const currentBlock = blockManager.getCurrentBlock(),
            curTextLength = currentBlock?.textContent?.length || 0;

          if (curModel?.getConfig("isEnterCreate")) {
            evt.preventDefault();

            if (cursorStart === cursorEnd && cursorStart === curTextLength) {
              blockManager.createBlock(defBlock);
              this.refresh();
            } else {
              if (cursorStart === cursorEnd) {
                blockManager.createBlock(defBlock, null, {
                  content: selectionApi.splitContent()
                });
              } else {
                blockManager.createBlock(defBlock);
              }
            }
          } else evt.stopPropagation();
        }

        this.trigger("keydownEnterKeyEnd", evt);
      } else if (evt.key == "Backspace") {
        this.trigger("keydownBackspaceKey", evt);
        if (blockManager.isEmpty()) {
          evt.preventDefault();
          const curIndex = blockManager.removeBlock();
          this.refresh();

          if (curIndex !== null) {
            const prevIndex = curIndex - 1,
              prevElem = blockManager.getByIndex(prevIndex);

            if (curIndex <= 0) {
              let defFocus = true;

              if (blockManager.count() > 0 && curIndex + 1 === 1) {
                const nextModel = blockManager.getModel();

                if (nextModel) {
                  const childFocus = nextModel?.focusChild();
                  if (childFocus !== null) {
                    childFocus.focus();
                    defFocus = false;
                  }
                }
              }

              if (defFocus) blockManager.focusByIndex(0);
            } else {
              if (prevElem) {
                const len = prevElem?.textContent?.length || 0;
                prevElem?.focus();

                if (len) selectionApi.select(len, len, prevElem);
              }
            }
          }
        } else {
          const index = blockManager.getIndex(),
            finalBlock = blockManager.getByIndex(index - 1),
            prevTextLength = finalBlock?.textContent?.length || 0,
            prevModel = blockManager.getModel(index - 1);

          const reSelect = () => {
            if (finalBlock) {
              setTimeout(() => {
                finalBlock?.focus();
                selectionApi.select(prevTextLength, prevTextLength, finalBlock);
              }, 10);
            }
          };

          // Merge if not an empty block
          if (cursorStart === 0 && cursorEnd === 0 && !curModel?.isEditableChilds()) {
            if (curModel?.isBackspaceRemove()) {
              evt.preventDefault();

              if (prevModel?.getConfig("autoMerge") && curModel.getConfig("autoMerge")) blockManager.merge(index - 1);
              else prevModel?.merge(index);
              reSelect();
            } else {
              // If the block is a text area
              if (curModel?.isTextArea()) {
                const curElement = curModel.getElement() as HTMLTextAreaElement,
                  { start, end } = selectionApi.getTextareaCursor(curElement);

                if (start === 0 && end === 0) {
                  if (isEmptyString(curElement.innerText)) {
                    evt.preventDefault();
                    blockManager.removeBlock();
                  }

                  reSelect();
                }
              }
            }
          }
        }

        this.trigger("keydownBackspaceKeyEnd", evt);
      }

      // If there are no blocks, we create an empty block by default.
      setTimeout(() => {
        if (blockManager.count() === 0) blockManager.createBlock(defBlock, -1);
      }, 10);
    }

    this.trigger("keydownEnd", evt);
    this.change({
      type: "keydown",
      event: evt
    });

    if (evt.key === "Enter" || evt.key === "Backspace" || evt.key === "Delete") {
      this.editor.historyManager.save();
    } else {
      this.editor.historyManager.scheduleSave();
    }
  }

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

  private performUndo(): void {
    this.trigger("undo", this.editor);

    const { historyManager } = this.editor;
    if (historyManager && typeof historyManager.undo === "function") {
      historyManager.undo();
    }
  }

  private performRedo(): void {
    this.trigger("redo", this.editor);

    const { historyManager } = this.editor;
    if (historyManager && typeof historyManager.redo === "function") {
      historyManager.redo();
    }
  }

  public setUndoRedoEnabled(enabled: boolean): void {
    this.isUndoRedoEnabled = enabled;
  }

  private onPasteHandle(evt: ClipboardEvent) {
    const { api, config, parser, blockManager, selectionApi } = this.editor;

    this.trigger("onPaste", evt);

    if (!evt.clipboardData) return;

    const defBlock = config.get("defaultBlock", "p"),
      currentModel = blockManager.getModel();

    // Если текущая модель имеет собственный обработчик вставки
    if (currentModel && "onPaste" in currentModel && typeof currentModel.onPaste === "function") {
      const pasteData = evt.clipboardData.getData("text/html") || "";
      const input = parser.parseHtml(pasteData, true);
      currentModel?.onPaste(evt, input);
      this.change({
        type: "paste",
        event: evt
      });
      currentModel?.sanitize();
      this.trigger("onPasteEnd", evt);
      return;
    }

    evt.preventDefault();

    if (currentModel?.isPreformatted()) {
      const plainText = evt.clipboardData.getData("text/plain");
      selectionApi.insertText(plainText);
    } else {
      const pasteData = evt.clipboardData.getData("text/html") || "";
      const input = parser.parseHtml(pasteData, true);

      if (input && input?.childNodes.length) {
        let reversedNodes: Node[] = [],
          isCreateBlocks = false;

        input?.childNodes.forEach((item: Node) => {
          reversedNodes.push(item);

          if (item.nodeType === Node.ELEMENT_NODE) {
            const element = item as Element;
            if (api.getRealType(element.localName)) isCreateBlocks = true;
          }
        });

        if (isCreateBlocks) reversedNodes = reversedNodes.reverse();

        reversedNodes.forEach((item: Node) => {
          if (isCreateBlocks) {
            if (item.nodeType === Node.TEXT_NODE) {
              if (!isEmptyString(item?.textContent || "")) {
                blockManager.createBlock(defBlock, null, {
                  content: item?.textContent || ""
                });
              }
            } else if (item.nodeType === Node.ELEMENT_NODE) {
              const tagName = item.nodeName.toLowerCase(),
                realName = api.getRealType(tagName) || api.getRealType(defBlock) || "p";

              if (realName) {
                const html = (item as Element)?.innerHTML;
                if (!isEmptyString(html)) {
                  blockManager.createBlock(realName, null, {
                    content: html
                  });
                }
              }
            }
          }
        });

        blockManager.detectEmpty();
      }
    }

    this.change();
    currentModel?.sanitize();
    this.trigger("onPasteEnd", evt);
    this.editor.historyManager.save();
  }

  private onDragStart(evt: DragEvent): void {
    evt.preventDefault();
  }

  private onDragLeave(evt: DragEvent) {
    evt.preventDefault();
  }

  private onDragOver(evt: DragEvent) {
    evt.preventDefault();
  }

  private onDrag(evt: DragEvent) {
    evt.preventDefault();
  }

  private onDrop(evt: DragEvent) {
    evt.preventDefault();
  }

  private onDragEnd(evt: DragEvent): void {
    evt.preventDefault();
  }

  private onSelectionChangeHandle(evt: Event) {
    const { api, actions, blockManager, selectionApi, toolbar } = this.editor,
      root = api.getRoot(),
      cssName = api.css("block");

    if (root) {
      this.trigger("onSelectionChange", evt);

      query(
        cssName,
        (el: HTMLElement) => {
          const range = selectionApi.getRange();

          if (range) {
            const target = range?.commonAncestorContainer || null,
              focusedBlock = closest(target, el);

            if (focusedBlock) {
              const index = blockManager.getElementIndex(focusedBlock),
                model = blockManager.getModel(index);

              let blockChild = null;

              if (model?.isEditableChilds()) {
                blockChild = model.editableChild() as HTMLElement;
              }

              blockManager.setIndex(index);
              actions.render();

              const element = blockChild || focusedBlock,
                [start, end] = selectionApi.getOffset(element);

              selectionApi.setCurrent(blockChild ? blockChild : focusedBlock, {
                start: start,
                end: end
              });

              toolbar.highlightActiveTools();

              const range = selectionApi.getRange();

              if (range && !range.collapsed && model?.isToolbar()) {
                toolbar.show();
                this.trigger("onSelectionChangeToolbarShow", evt, range);
              } else {
                this.trigger("onSelectionChangeToolbaHide", evt, range);
                toolbar.hide();
              }
            }
          }
        },
        root
      );

      this.trigger("onSelectionChangeEnd", evt);
    }
  }
}
