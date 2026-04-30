import type {
  BlockCreateItemSchema,
  BlockNode,
  EventsInterface,
  EventTriggerObject,
  PasteMap,
  PasteMapItem,
  TexditorEvent,
  TexditorInterface
} from "@/types";
import { encodeHtmlSpecialChars, executeMethodIfExists, generateRandomString } from "@/utils/common";
import {
  addClass,
  append,
  appendText,
  closest,
  getChildNodes,
  getLength,
  getText,
  html,
  make,
  parseHtml,
  removeClass,
  toHtml,
  toTextNode
} from "@/utils/dom";
import { off, on, rebind } from "@/utils/events";
import { query } from "@/utils/dom";
import { isEmptyString } from "@/utils/string";
import { globalStore } from "@/store/globalStore";

export default class Events implements EventsInterface {
  /** Reference to the main editor instance */
  private editor: TexditorInterface;

  /** Storage for registered event callbacks */
  private triggers: EventTriggerObject = {};

  /** Unique identifier for event listeners to prevent conflicts */
  private eventId: string = generateRandomString(16);

  constructor(editor: TexditorInterface) {
    this.editor = editor;
    this.onDocumentKeyDownHandle = this.onDocumentKeyDownHandle.bind(this);
    this.onKeyDownHandle = this.onKeyDownHandle.bind(this);
    this.onKeyUpHandle = this.onKeyUpHandle.bind(this);
    this.onPasteHandle = this.onPasteHandle.bind(this);
    this.onFocusHandle = this.onFocusHandle.bind(this);
    this.onClickHandle = this.onClickHandle.bind(this);
    this.onBlurHandle = this.onBlurHandle.bind(this);
    this.onSelectionChangeHandle = this.onSelectionChangeHandle.bind(this);
    this.handleHistoryShortcuts = this.handleHistoryShortcuts.bind(this);
    this.onDragStart = this.onDragStart.bind(this);
    this.onDragLeave = this.onDragLeave.bind(this);
    this.onDragOver = this.onDragOver.bind(this);
    this.onDrag = this.onDrag.bind(this);
    this.onDrop = this.onDrop.bind(this);
    this.onDragEnd = this.onDragEnd.bind(this);
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
    const { blockManager } = this.editor,
      eid = this.eventId,
      blockContainer = blockManager.getBlocksContainer();

    if (!blockContainer)
      throw new Error("The root element of the editor was not found.");

    blockManager.refreshVirtualSelection();

    rebind(
      document,
      'dblclick.docEvt' + eid,
      () => blockManager.clearVirtualSelection(),
      true
    );

    rebind(
      document,
      "keydown.docEvt" + eid,
      this.onDocumentKeyDownHandle,
      true
    );

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
   */
  ready() {
    const {
      api,
      blockManager,
      config,
      extensions,
      historyManager
    } = this.editor;

    setTimeout(() => {
      executeMethodIfExists(api, '__mount');
      historyManager.save();
      extensions.apply();

      const readyCallback = config.get("onReady", false);

      if (typeof readyCallback === "function")
        readyCallback(this);

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
      blockManager,
      config,
      extensions,
      historyManager
    } = this.editor;

    const changeHandle = config.get("onChange", false);

    blockManager.detectEmpty();
    blockManager.normalize();

    if (changeHandle && typeof changeHandle === "function") {
      if (!this.exists("onChange.onReady"))
        this.add("onChange.onReady", changeHandle);
    }

    extensions.refresh();

    this.trigger("onChange", event);

    if (
      event.type != "keydown" &&
      event.type != "keyup" &&
      event.type != "historySave" &&
      event.type != "virtualSelectionChange"
    ) {
      historyManager.save();
    }
  }

  /**
   * Handles focus events on blocks
   * @param evt - Focus event
   */
  private onFocusHandle(evt: FocusEvent) {
    this.trigger("focus", { domEvent: evt });
    this.setIndexByTarget(evt.target);
    const model = this.editor.blockManager.getModel();

    if (model && executeMethodIfExists(model, '__onFocus', [evt]))
      evt.preventDefault();

    this.trigger("focusEnd", { domEvent: evt });
  }

  /**
   * Handles click events on blocks
   * @param evt - Mouse event
   */
  private onClickHandle(evt: MouseEvent) {
    this.trigger("click", { domEvent: evt });
    this.setIndexByTarget(evt.target);

    const model = this.editor.blockManager.getModel();

    if (model)
      executeMethodIfExists(model, '__onClick', [evt]);

    this.trigger("clickEnd", { domEvent: evt });
  }

  /**
   * Handles blur events on blocks
   * @param evt - Focus event
   */
  private onBlurHandle(evt: FocusEvent) {
    const model = this.editor.blockManager.getModel();

    if (model && executeMethodIfExists(model, '__onBlur', [evt]))
      evt.preventDefault();

    this.trigger("blur", { domEvent: evt });
  }

  /**
   * Handles keyup events on blocks
   * @param evt - Keyboard event
   */
  private onKeyUpHandle(evt: KeyboardEvent) {
    const { blockManager, historyManager } = this.editor;

    this.trigger("keyup", { domEvent: evt });
    this.setIndexByTarget(evt.target);

    const model = blockManager.getModel();

    if (model && executeMethodIfExists(model, '__onKeyUp', [evt]))
      evt.preventDefault();

    this.change({
      type: "keyup",
      domEvent: evt
    });

    this.trigger("keyupEnd", { domEvent: evt });
    historyManager.scheduleSave();
  }

  /**
   * Sets the current block index based on target
   * @param target - Event target
   */
  private setIndexByTarget(target?: EventTarget | null) {
    const { blockManager } = this.editor;

    if (target) {
      const blockNode = blockManager.findParent(target);

      if (blockNode) {
        const targetIndex = blockManager.getIndex(blockNode);
        this.setIndex(targetIndex);
      }
    }
  }

  /**
   * Sets the current block index and updates active item styling
   * @param index - Block index to set as current
   */
  private setIndex(index: number) {
    const { blockManager } = this.editor;

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
   * Handles document-level keydown events for global shortcuts
   * @param evt - Keyboard event
   */
  private onDocumentKeyDownHandle(evt: KeyboardEvent): void {
    const { api, blockManager } = this.editor,
      root = api.getRoot();

    if (!root)
      return;

    this.trigger("docuemntKeydown", { domEvent: evt });

    if (globalStore.get('el') === root) {
      if (this.handleHistoryShortcuts(evt)) {
        this.trigger("docuemntKeydownEnd", { domEvent: evt });
        return;
      }
    }

    const deleteSelectedBlocks = () => {
      const virtualSelection = blockManager.getVirtualSelection();

      if (virtualSelection) {
        const list = virtualSelection.getSelectedIndices();

        if (list.length)
          blockManager.removeBlock(list);
      }
    }

    if (evt.key == "Backspace" || evt.key == "Delete") {
      deleteSelectedBlocks();
      this.trigger("docuemntKeydownBackspace", { domEvent: evt });
    }

    this.trigger("docuemntKeydownEnd", { domEvent: evt });
  }

  /**
   * Handles keydown events with special behavior for Enter, Backspace, etc.
   * @param evt - Keyboard event
   */
  private onKeyDownHandle(evt: KeyboardEvent) {
    const { blockManager, historyManager, selectionApi, config, api } = this.editor;

    this.trigger("keydown", { domEvent: evt });

    if (evt.target) {
      const blockNode = blockManager.findParent(evt.target);

      if (blockNode) {
        blockManager.use(
          blockManager.getIndex(blockNode)
        );
      }
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

    executeMethodIfExists(model, '__onKeyDown', [evt]);

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
      if (api.isEmpty() && blockManager.count() == 0) blockManager.createBlock(defBlock);

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
                  data: selectionApi.splitContent(contentNode)
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
   * Handles keyboard shortcuts for undo/redo operations
   * @param evt - Keyboard event
   * @returns True if undo/redo was handled
   */
  private handleHistoryShortcuts(evt: KeyboardEvent): boolean {
    const { historyManager } = this.editor;
    if (!this.editor.config.get('historyShortcuts', true))
      return false;

    const { ctrlKey, shiftKey, metaKey, code } = evt,
      isCommand = metaKey;

    // Ctrl+Z | Cmd+Z - Undo
    if ((ctrlKey || isCommand) && !shiftKey && code === "KeyZ") {
      evt.preventDefault();
      historyManager.undo();
      this.trigger("undo", { type: "undo" });
      return true;
    }

    // Ctrl+Shift+Z | Cmd+Shift+Z | Ctrl+Y - Redo 
    if (
      ((ctrlKey || isCommand) && shiftKey && code === "KeyZ") ||
      ((ctrlKey || isCommand) && !shiftKey && code === "KeyY")
    ) {
      const { historyManager } = this.editor;
      historyManager.redo();
      this.trigger("redo", { type: "undo" });
    }

    return false;
  }

  /**
   * Preparing a data map for text insertion.
   * @param childNodes 
   * @returns {PasteMap}
   */
  private createPasteMap(childNodes: Node[]): PasteMap {
    const { blockManager } = this.editor;
    const map: PasteMapItem[] = [];
    const schema = 'block';

    const processTextNode = (node: Node) => {
      if (!isEmptyString(node?.textContent || '')) {
        map.push({ type: 'textNode', node });
      }
    };

    const processElementNode = (node: Element) => {
      const nodeName = node.nodeName.toLowerCase();

      if (blockManager.getRealName(nodeName)) {
        map.push({ type: 'block', node });
        return true;
      }

      const childNodes = getChildNodes(node);
      const childLength = childNodes.length;

      if (!childLength) return false;

      const elementChildren = childNodes.filter(cn => cn.nodeType === Node.ELEMENT_NODE);

      if (elementChildren.length !== childLength) return false;

      let hasBlocks = false;
      elementChildren.forEach(child => {
        if (blockManager.getRealName(child.nodeName.toLowerCase())) {
          map.push({ type: 'block', node: child });
          hasBlocks = true;
        }
      });

      return hasBlocks;
    };

    childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        processTextNode(node);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const isBlockProcessed = processElementNode(node as Element);
        if (!isBlockProcessed) {
          map.push({
            type: node.nodeType === Node.ELEMENT_NODE ? 'node' : 'textNode',
            node
          });
        }
      }
    });

    const oneBlock = map.filter(item => item.type === 'block'),
      onlyTextNodes = map.filter(item => item.type === 'textNode');

    if (onlyTextNodes.length === map.length) {
      return { schema: 'node', data: onlyTextNodes };
    }

    const mapResult: PasteMapItem[] = [];

    if (oneBlock.length === 0) {
      map.forEach(item => mapResult.push({ type: 'node', node: item.node }));
      return { schema: 'node', data: mapResult };
    }

    if (oneBlock.length === 1) {
      const blockItem = map.find(item => item.type === 'block');
      if (blockItem) {
        getChildNodes(blockItem.node).forEach(node => {
          mapResult.push({
            type: node.nodeType === Node.ELEMENT_NODE ? 'node' : 'textNode',
            node
          });
        });
        return { schema: 'node', data: mapResult };
      }
    }

    map.forEach((item, index) => {
      if (item.type === 'node' || item.type === 'textNode') {
        const prevItem = map[index - 1];
        const pushToNode = (targetNode: Node) => {
          if (item.type === 'textNode') {
            appendText(targetNode, item.node.textContent || '');

          } else {
            const childs = getChildNodes(item.node);
            append(targetNode, childs);
          }
        };

        if (prevItem?.type === 'node') {
          pushToNode(prevItem.node);
        } else {
          const newBlock = make('p', (p: HTMLParagraphElement) => pushToNode(p));
          mapResult.push({ type: 'block', node: newBlock });
        }
      } else if (item.type === 'block') {
        mapResult.push({ type: 'block', node: item.node });
      }
    });

    return { schema, data: mapResult };
  }

  /**
   * Handles paste events with smart content parsing
   * @param evt - Clipboard event
   */
  private onPasteHandle(evt: ClipboardEvent) {
    const {
      config,
      blockManager,
      selectionApi
    } = this.editor;

    this.trigger("onPaste", { domEvent: evt });

    if (!evt.clipboardData) return;

    evt.preventDefault();

    const defBlock = config.get("defaultBlock", "p"),
      model = blockManager.getModel();

    if (model) {
      const textInput = evt.clipboardData.getData("text/plain"),
        htmlInput = evt.clipboardData.getData("text/html");

      const pasteData = model.isRaw() ? textInput : htmlInput;

      const input = parseHtml(pasteData, true);

      if (input.length) {
        const childNodes = input;
        const map = this.createPasteMap(childNodes);
        const onPasteModel = executeMethodIfExists(model, '__onPaste', [evt, map]),
          schemas = blockManager.getSchemas(),
          currentIndex = blockManager.getIndex(),
          isEmpty = blockManager.isEmpty();

        if (onPasteModel) {
          if (map.data.length) {
            if (map.schema === 'block') {
              let nextIndex = currentIndex === 0 && isEmpty ? 0 : currentIndex + 1;
              const nodes: Node[] = [];
              map.data.forEach((item) => {
                appendText(item.node, ' ');
                nodes.push(item.node)
              });

              if (model.isRaw()) {
                selectionApi.insertText(
                  encodeHtmlSpecialChars(
                    getText(nodes) + ' '
                  )
                );

                model.sanitize();
              } else {
                map.data.forEach((item) => {
                  const node = item.node;

                  schemas.forEach((schema) => {
                    const nodeName = node.nodeName.toLowerCase();
                    const realName = blockManager.getRealName(nodeName) ||
                      blockManager.getRealName(defBlock) ||
                      "p";
                    const schemaModel = schema.model;
                    const names = schemaModel.getSupportedNames();

                    if (names.includes(realName)) {
                      let newBlock: BlockNode | null = null;

                      if (schemaModel.isEditable() && !schemaModel.isEditableItems()) {
                        const html = (node as Element)?.innerHTML;
                        newBlock = blockManager.createBlock(realName, nextIndex, {
                          data: html
                        });
                        nextIndex++;
                      } else if (!schemaModel.isEditable() && schemaModel.isEditableItems()) {
                        const items: BlockCreateItemSchema[] = [];

                        getChildNodes(node).forEach((child: Node) => {
                          const childNodeName = child.nodeName.toLowerCase(),
                            relatedNames = [
                              schemaModel.getItemName(),
                              ...schemaModel.getItemRelatedNames()
                            ];

                          if (relatedNames.includes(childNodeName)) {
                            items.push({
                              type: schemaModel.getItemName(),
                              data: toHtml(getChildNodes(child))
                            })
                          }
                        });

                        if (items) {
                          newBlock = blockManager.createBlock(realName, nextIndex, {
                            data: items
                          });
                          nextIndex++;
                        }
                      }

                      if (newBlock) {
                        const newModel = newBlock.baseModel;
                        newModel.sanitize();
                      }
                    }
                  });
                });
              }

              blockManager.focus(
                !model.isEmpty() ? nextIndex - 1 : nextIndex
              );
            } else {
              const nodes: Node[] = [];
              map.data.forEach((item) => nodes.push(item.node));

              if (nodes.length) {
                if (model.isRaw()) {
                  selectionApi.insertText(
                    encodeHtmlSpecialChars(getText(nodes))
                  );
                } else {
                  const sanitizerConfig = model.getSanitizerConfig(),
                    safeNodes: Node[] = [];

                  nodes.forEach((node: Node) => {
                    if (sanitizerConfig.elements?.includes(node.nodeName.toLowerCase())) {
                      safeNodes.push(node)
                    } else {
                      const text = getText(node);

                      if (!isEmptyString(text)) {
                        safeNodes.push(toTextNode(text));
                      }
                    }
                  });

                  const div = make(
                    'div',
                    (el: HTMLElement) => append(el, safeNodes)
                  );

                  selectionApi.insert(html(div));
                }
              }

              model.sanitize()
              blockManager.focus(-1);
            }
          }
        }

        this.change({
          type: "paste",
          domEvent: evt,
          map: map
        });
      }

      this.trigger("onPasteEnd", { domEvent: evt });
    }
  }

  private defEvent(name: string, evt: Event) {
    const { blockManager } = this.editor;
    const model = blockManager.getModel(),
      __name = '__' + name;

    if (
      model && executeMethodIfExists(model, __name, [evt])
    ) {
      evt.preventDefault();
    }

    this.trigger(name, { domEvent: evt });
  }

  /**
   * Prevents default drag start behavior
   * @param evt - Drag event
   */
  private onDragStart(evt: DragEvent): void {
    this.defEvent('onDragStart', evt);
  }

  /**
   * Prevents default drag leave behavior
   * @param evt - Drag event
   */
  private onDragLeave(evt: DragEvent) {
    this.defEvent('onDragLeave', evt);
  }

  /**
   * Prevents default drag over behavior
   * @param evt - Drag event
   */
  private onDragOver(evt: DragEvent) {
    this.defEvent('onDragOver', evt);
  }

  /**
   * Prevents default drag behavior
   * @param evt - Drag event
   */
  private onDrag(evt: DragEvent) {
    this.defEvent('onDrag', evt);
  }


  /**
   * Prevents default drag end behavior
   * @param evt - Drag event
   */
  private onDragEnd(evt: DragEvent): void {
    this.defEvent('onDragEnd', evt);
  }

  /**
   * Prevents default drop behavior
   * @param evt - Drag event
   */
  private onDrop(evt: DragEvent) {
    this.defEvent('onDrop', evt);
  }

  /**
   * Handles selection change events
   * Updates tools and actions based on current selection
   * @param evt - Event
   */
  private onSelectionChangeHandle(evt: Event) {
    const {
      api,
      blockManager,
      selectionApi
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
                model = blockManager.getModel(index);

              this.setIndex(index);

              if (model) {
                const contentNode = model.getContentNode(),
                  blockItem = model.isEditableItems()
                    ? model.getItemBody(-1)
                    : null;

                const element = blockItem || contentNode,
                  [start, end] = selectionApi.getOffset(element);

                if (element) {
                  selectionApi.setCurrent(element, {
                    start: start,
                    end: end
                  });
                }

                const range = selectionApi.getRange();

                if (range && model)
                  executeMethodIfExists(model, '__onSelectionChange', [evt, range]);
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
    const root = api.getRoot(),
      eid = this.eventId;

    off(document, 'dblclick.docEvt' + eid, true);
    off(document, "keydown.docEvt" + eid, true);

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