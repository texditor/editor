import type {
  BlockCreateItemSchema,
  BlockElement,
  PasteMap,
  PasteMapItem,
  TexditorEventBase,
  Texditor,
  Events as IEvents,
} from '@/types';

import { executeMethodIfExists } from '@/utils/common';
import { currentStore } from '@/store/currentStore';
import EventManager from './base/event-manager';

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
  toTextNode,
  query,
  off,
  rebind,
  isEmptyString,
  escapeHtml,
  randString,
} from 'snappykit';

export default class Events extends EventManager implements IEvents {
  /** Reference to the main editor instance */
  private editor: Texditor;

  /** Unique identifier for event listeners to prevent conflicts */
  private eventId: string = randString(16);

  private isPaused: boolean = false;

  constructor(editor: Texditor) {
    super();
    this.editor = editor;
  }

  /** @see IEvents.refresh */
  refresh(): void {
    const { blockManager, extensions } = this.editor,
      eid = this.eventId,
      blockContainer = blockManager.getBlocksContainer();

    if (!blockContainer) throw new Error('The root element of the editor was not found.');

    blockManager.refreshVirtualSelection();

    rebind(document, 'dblclick.docEvt' + eid, () => blockManager.clearVirtualSelection(), true);
    rebind(document, 'click.docEvt' + eid, () => extensions.refresh(), true);
    rebind(document, 'keydown.docEvt' + eid, (evt: KeyboardEvent) => this.onDocumentKeyDownHandle(evt), true);

    query(
      '.tex-block-content',
      (el: HTMLElement) => {
        rebind(el, 'keydown.e', (evt: KeyboardEvent) => this.onKeyDownHandle(evt));
        rebind(el, 'keyup.e', (evt: KeyboardEvent) => this.onKeyUpHandle(evt));
        rebind(el, 'paste.e', (evt: ClipboardEvent) => this.onPasteHandle(evt));
        rebind(el, 'dragstart.e', (evt: DragEvent) => this.onDragStart(evt));
        rebind(el, 'dragleave.e', (evt: DragEvent) => this.onDragLeave(evt));
        rebind(el, 'dragover.e', (evt: DragEvent) => this.onDragOver(evt));
        rebind(el, 'drag.e1', (evt: DragEvent) => this.onDrag(evt));
        rebind(el, 'drop.e1', (evt: DragEvent) => this.onDrop(evt));
        rebind(el, 'dragend.e', (evt: DragEvent) => this.onDragEnd(evt));
        rebind(el, 'focus.e', (evt: FocusEvent) => this.onFocusHandle(evt));
        rebind(el, 'blur.e', (evt: FocusEvent) => this.onBlurHandle(evt));
        rebind(el, 'click.e', (evt: MouseEvent) => this.onClickHandle(evt));
      },
      blockContainer,
    );

    rebind(document, 'selectionchange.e' + this.eventId, (evt: Event) => this.onSelectionChangeHandle(evt));
  }

  /** @see IEvents.change */
  change(event: TexditorEventBase): void {
    const { blockManager, config, extensions, historyManager } = this.editor;

    const changeHandle = config.get('onChange', false);

    blockManager.detectEmpty();
    blockManager.normalize();

    if (changeHandle && typeof changeHandle === 'function') {
      if (!this.hasEvent('onChange.onReady')) this.on('onChange.onReady', changeHandle);
    }

    extensions.refresh();

    this.trigger('onChange', event);

    if (
      event.type != 'keydown' &&
      event.type != 'keyup' &&
      event.type != 'historySave' &&
      event.type != 'virtualSelectionChange'
    ) {
      historyManager.save();
    }
  }

  /**
   * Handles focus events on blocks
   * @param evt - Focus event
   */
  private onFocusHandle(evt: FocusEvent): void {
    this.trigger('focus', { domEvent: evt });
    this.setIndexByTarget(evt.target);
    const model = this.editor.blockManager.getModel();

    if (model && executeMethodIfExists(model, '__onFocus', [evt])) evt.preventDefault();

    this.trigger('focusEnd', { domEvent: evt });
  }

  /**
   * Handles click events on blocks
   * @param evt - Mouse event
   */
  private onClickHandle(evt: MouseEvent): void {
    this.trigger('click', { domEvent: evt });
    this.setIndexByTarget(evt.target);

    const model = this.editor.blockManager.getModel();

    if (model) executeMethodIfExists(model, '__onClick', [evt]);

    this.trigger('clickEnd', { domEvent: evt });
  }

  /**
   * Handles blur events on blocks
   * @param evt - Focus event
   */
  private onBlurHandle(evt: FocusEvent): void {
    const model = this.editor.blockManager.getModel();

    if (model && executeMethodIfExists(model, '__onBlur', [evt])) evt.preventDefault();

    this.trigger('blur', { domEvent: evt });
  }

  /**
   * Handles keyup events on blocks
   * @param evt - Keyboard event
   */
  private onKeyUpHandle(evt: KeyboardEvent): void {
    const { blockManager, historyManager } = this.editor;

    this.trigger('keyup', { domEvent: evt });
    this.setIndexByTarget(evt.target);

    const model = blockManager.getModel();

    if (model && executeMethodIfExists(model, '__onKeyUp', [evt])) evt.preventDefault();

    this.change({
      type: 'keyup',
      domEvent: evt,
    });

    this.trigger('keyupEnd', { domEvent: evt });
    historyManager.scheduleSave();
  }

  /**
   * Sets the current block index based on target
   * @param target - Event target
   */
  private setIndexByTarget(target?: EventTarget | null): void {
    const { blockManager } = this.editor;

    if (target) {
      const blockElement = blockManager.findParent(target);

      if (blockElement) {
        const targetIndex = blockManager.getIndex(blockElement);
        this.setIndex(targetIndex);
      }
    }
  }

  /**
   * Sets the current block index and updates active item styling
   * @param index - Block index to set as current
   */
  private setIndex(index: number): void {
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
            removeClass(item, className);
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
    const { blockManager } = this.editor,
      root = this.editor.getRoot();

    if (!root) return;

    this.trigger('documentKeydown', { domEvent: evt });

    if (currentStore.get('el') === root) {
      if (this.handleHistoryShortcuts(evt)) {
        this.trigger('documentKeydownEnd', { domEvent: evt });
        return;
      }
    }

    const deleteSelectedBlocks = () => {
      const virtualSelection = blockManager.getVirtualSelection();

      if (virtualSelection) {
        const list = virtualSelection.getSelectedIndices();

        if (list.length) blockManager.removeBlock(list);
      }
    };

    if (evt.key == 'Backspace' || evt.key == 'Delete') {
      deleteSelectedBlocks();
      this.trigger('documentKeydownBackspace', { domEvent: evt });
    }

    this.trigger('documentKeydownEnd', { domEvent: evt });
  }

  /**
   * Handles keydown events with special behavior for Enter, Backspace, etc.
   * @param evt - Keyboard event
   */
  private onKeyDownHandle(evt: KeyboardEvent): void {
    const { blockManager, historyManager, selectionApi, config } = this.editor;

    this.trigger('keydown', { domEvent: evt });

    if (evt.target) {
      const blockElement = blockManager.findParent(evt.target);

      if (blockElement) {
        blockManager.use(blockManager.getIndex(blockElement));
      }
    }

    const blocksContainer = blockManager.getBlocksContainer(),
      defBlock = config.get('defaultBlock', 'p'),
      model = blockManager.getModel(),
      contentElement = blockManager.getContentElement();

    const breakEvent = () => {
      evt.stopPropagation();
      evt.preventDefault();
    };

    if (!model) {
      breakEvent();
      return;
    }

    executeMethodIfExists(model, '__onKeyDown', [evt]);

    const focusedNode = model.isEditableItems() && model.getItemBody(-1) ? model.getItemBody(-1) : contentElement;

    if (!focusedNode) {
      breakEvent();
      return;
    }

    const [start, end] = selectionApi.getOffset(focusedNode),
      curTextLength = contentElement?.textContent?.length || 0,
      cursorStart = start < 0 ? 0 : start,
      cursorEnd = end < 0 ? 0 : end;

    if (blocksContainer && contentElement) {
      if (this.editor.isEmpty() && blockManager.count() == 0) blockManager.createBlock(defBlock);

      if (evt.key == 'Enter') {
        this.trigger('keydownEnterKey', { domEvent: evt });

        if (closest(evt.target, contentElement)) {
          if (model.isEditableItems()) {
            if (model.isEnterCreate()) {
              breakEvent();

              const itemIndex = model.getItemIndex(),
                isEmptyItem = model.isEmptyItem(itemIndex);

              if (isEmptyItem && model.getItemsLength() === itemIndex + 1) {
                model.removeItem(itemIndex);
                blockManager.createBlock(defBlock);
              } else {
                if (!isEmptyItem && !model?.isEmptyItem(itemIndex - 1) && cursorStart != 0 && cursorEnd != 0) {
                  if (model.canCreateItem()) {
                    model.createItem(selectionApi.splitContent(model.getItemBody(-1)));
                  }
                }
              }
            }
          } else {
            if (model.isEnterCreate()) {
              breakEvent();

              if ((cursorStart === cursorEnd && cursorStart === curTextLength) || cursorStart !== cursorEnd) {
                if (!model.isEmpty()) blockManager.createBlock(defBlock);
              } else {
                blockManager.createBlock(defBlock, -1, {
                  data: selectionApi.splitContent(contentElement),
                });
              }
            }
          }
        }

        this.trigger('keydownEnterKeyEnd', { domEvent: evt });
      } else if (evt.key == 'Backspace') {
        this.trigger('keydownBackspaceKey', { domEvent: evt });

        if (blockManager.count() > 1) {
          const index = blockManager.getIndex();
          if (model.isEditableItems() && model.getItemIndex() > 0 && cursorStart == 0 && cursorEnd == 0) {
            breakEvent();
            const itemChild = getChildNodes(focusedNode),
              itemIndex = model.getItemIndex();

            const prevItemBody = model.getItemBody(itemIndex - 1);

            if (prevItemBody) {
              const prevLength = getLength(prevItemBody);

              if (prevLength) {
                appendText(prevItemBody, ' ');
                append(prevItemBody, itemChild);
                blockManager.focus(index, prevLength, prevLength, itemIndex - 1);
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

                blockManager.focus(curIndex ? curIndex - 1 : 0, undefined, undefined, prevLength);
              }
            } else {
              // Merge if not an empty block
              if (cursorStart === 0 && cursorEnd === 0 && model?.isBackspaceRemove()) {
                const pervIndex = index - 1;

                evt.preventDefault();
                blockManager.merge(index, pervIndex, pervIndex);
              }
            }
          }
        }

        this.trigger('keydownBackspaceKeyEnd', { domEvent: evt });
      }
    }

    this.trigger('keydownEnd', { domEvent: evt });
    this.change({
      type: 'keydown',
      event: evt,
    });

    if (evt.key === 'Enter' || evt.key === 'Backspace' || evt.key === 'Delete') {
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
    if (!this.editor.config.get('historyShortcuts', true)) return false;

    const { ctrlKey, shiftKey, metaKey, code } = evt,
      isCommand = metaKey;

    // Ctrl+Z | Cmd+Z - Undo
    if ((ctrlKey || isCommand) && !shiftKey && code === 'KeyZ') {
      evt.preventDefault();
      historyManager.undo();
      this.trigger('undo', { type: 'undo' });
      return true;
    }

    // Ctrl+Shift+Z | Cmd+Shift+Z | Ctrl+Y - Redo
    if (
      ((ctrlKey || isCommand) && shiftKey && code === 'KeyZ') ||
      ((ctrlKey || isCommand) && !shiftKey && code === 'KeyY')
    ) {
      const { historyManager } = this.editor;
      historyManager.redo();
      this.trigger('redo', { type: 'undo' });
    }

    return false;
  }

  /**
   * Builds a structured paste map from child nodes, classifying them as blocks, text nodes, or generic nodes.
   * @param childNodes - The child nodes to process.
   * @returns A paste map with the determined schema and classified items.
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

      const elementChildren = childNodes.filter((cn) => cn.nodeType === Node.ELEMENT_NODE);

      if (elementChildren.length !== childLength) return false;

      let hasBlocks = false;
      elementChildren.forEach((child) => {
        if (blockManager.getRealName(child.nodeName.toLowerCase())) {
          map.push({ type: 'block', node: child });
          hasBlocks = true;
        }
      });

      return hasBlocks;
    };

    childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        processTextNode(node);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const isBlockProcessed = processElementNode(node as Element);
        if (!isBlockProcessed) {
          map.push({
            type: node.nodeType === Node.ELEMENT_NODE ? 'node' : 'textNode',
            node,
          });
        }
      }
    });

    const oneBlock = map.filter((item) => item.type === 'block'),
      onlyTextNodes = map.filter((item) => item.type === 'textNode');

    if (onlyTextNodes.length === map.length) {
      return { schema: 'node', data: onlyTextNodes };
    }

    const mapResult: PasteMapItem[] = [];

    if (oneBlock.length === 0) {
      map.forEach((item) => mapResult.push({ type: 'node', node: item.node }));
      return { schema: 'node', data: mapResult };
    }

    if (oneBlock.length === 1) {
      const blockItem = map.find((item) => item.type === 'block');
      if (blockItem) {
        getChildNodes(blockItem.node).forEach((node) => {
          mapResult.push({
            type: node.nodeType === Node.ELEMENT_NODE ? 'node' : 'textNode',
            node,
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
            const childNodes = getChildNodes(item.node);
            append(targetNode, childNodes);
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
  private onPasteHandle(evt: ClipboardEvent): void {
    if (this.isPaused) return;

    this.isPaused = true;

    const { config, blockManager, selectionApi } = this.editor;

    this.trigger('onPaste', { domEvent: evt });

    if (!evt.clipboardData) return;

    evt.preventDefault();

    const defBlock = config.get('defaultBlock', 'p'),
      model = blockManager.getModel();

    if (!model) return;

    const textInput = evt.clipboardData.getData('text/plain'),
      htmlInput = evt.clipboardData.getData('text/html');

    const pasteData = model.isRaw() ? textInput : htmlInput;

    let input: Node[];
    if (isEmptyString(htmlInput) && !isEmptyString(textInput)) {
      input = [toTextNode(textInput)];
    } else {
      input = parseHtml(pasteData, true);
    }

    if (!input.length) return;

    const map = this.createPasteMap(input);
    const onPasteModel = executeMethodIfExists(model, '__onPaste', [evt, map]);

    if (!onPasteModel || !map.data.length) return;

    const schemas = blockManager.getSchemas();
    const currentIndex = blockManager.getIndex();
    const isEmptyBlock = blockManager.isEmpty();

    if (map.schema === 'block') {
      let nextIndex = currentIndex === 0 && isEmptyBlock ? 0 : currentIndex + 1;

      if (model.isRaw()) {
        const textNodes: Node[] = [];

        for (const item of map.data) {
          appendText(item.node, ' ');
          textNodes.push(item.node);
        }

        const text = getText(textNodes) + ' ';
        selectionApi.insertText(escapeHtml(text));
        model.sanitize();
      } else {
        for (const item of map.data) {
          const node = item.node;
          let blockCreated = false;

          for (const schema of schemas) {
            if (blockCreated) break;

            const nodeName = node.nodeName.toLowerCase();
            const realName = blockManager.getRealName(nodeName) || blockManager.getRealName(defBlock) || 'p';
            const schemaModel = schema.model;
            const names = schemaModel.getSupportedNames();

            if (!names.includes(realName)) continue;

            if (schemaModel.isEditable() && !schemaModel.isEditableItems()) {
              const htmlContent = (node as Element)?.innerHTML || '';

              if (!isEmptyString(htmlContent)) {
                const newBlock = blockManager.createBlock(realName, nextIndex, { data: htmlContent }, true);
                if (newBlock) {
                  newBlock.baseModel.sanitize();
                  nextIndex++;
                  blockCreated = true;
                }
              }
            } else if (!schemaModel.isEditable() && schemaModel.isEditableItems()) {
              const items: BlockCreateItemSchema[] = [];
              const itemName = schemaModel.getItemName();
              const relatedNames = schemaModel.getItemRelatedNames();
              const allItemNames = [itemName, ...relatedNames];
              const children = getChildNodes(node);

              for (const child of children) {
                const childNodeName = child.nodeName.toLowerCase();

                if (allItemNames.includes(childNodeName)) {
                  const childNodes = getChildNodes(child);
                  const htmlData = toHtml(childNodes);

                  if (!isEmptyString(htmlData)) {
                    items.push({
                      type: itemName,
                      data: htmlData,
                    });
                  }
                }
              }

              if (items.length > 0) {
                const newBlock = blockManager.createBlock(realName, nextIndex, { data: items }, true);
                if (newBlock) {
                  newBlock.baseModel.sanitize();
                  nextIndex++;
                  blockCreated = true;
                }
              }
            }
          }
        }
      }

      const focusIndex = !model.isEmpty() ? nextIndex - 1 : nextIndex;

      blockManager.focus(focusIndex >= 0 ? focusIndex : 0);
    } else {
      const { position } = selectionApi.getState();
      const nodes: Node[] = [];

      for (const item of map.data) {
        nodes.push(item.node);
      }

      if (nodes.length > 0) {
        if (model.isRaw()) {
          const text = escapeHtml(getText(nodes));
          selectionApi.insertText(text);
        } else {
          const sanitizerConfig = model.getSanitizerConfig();
          const safeNodes: Node[] = [];

          for (const node of nodes) {
            if (sanitizerConfig.elements?.includes(node.nodeName.toLowerCase())) {
              safeNodes.push(node);
            } else {
              const text = getText(node);
              if (!isEmptyString(text)) {
                safeNodes.push(toTextNode(text));
              }
            }
          }

          if (safeNodes.length > 0) {
            const div = make('div', (el: HTMLElement) => {
              append(el, safeNodes);
            });
            selectionApi.insert(html(div));
          }
        }

        model.sanitize();
        blockManager.focus(-1);

        if (!model.isRaw()) {
          selectionApi.select(position.end, position.end);
        }
      }
    }

    this.change({
      type: 'paste',
      domEvent: evt,
      map: map,
    });

    this.refresh();

    this.isPaused = false;

    this.trigger('onPasteEnd', { domEvent: evt });
  }

  /**
   * The basic DOM event
   * @param name - Event Name
   * @param evt - The DOM event object.
   */
  private defEvent(name: string, evt: Event): void {
    const { blockManager } = this.editor;
    const model = blockManager.getModel(),
      __name = '__' + name;

    if (model && executeMethodIfExists(model, __name, [evt])) {
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
  private onDragLeave(evt: DragEvent): void {
    this.defEvent('onDragLeave', evt);
  }

  /**
   * Prevents default drag over behavior
   * @param evt - Drag event
   */
  private onDragOver(evt: DragEvent): void {
    this.defEvent('onDragOver', evt);
  }

  /**
   * Prevents default drag behavior
   * @param evt - Drag event
   */
  private onDrag(evt: DragEvent): void {
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
  private onDrop(evt: DragEvent): void {
    this.defEvent('onDrop', evt);
  }

  /**
   * Handles selection change events
   * Updates tools and actions based on current selection
   * @param evt - Event
   */
  private onSelectionChangeHandle(evt: Event): void {
    const { blockManager, selectionApi, tools } = this.editor;

    const root = this.editor.getRoot();

    if (root) {
      this.trigger('onSelectionChange', { domEvent: evt });

      blockManager.clearVirtualSelection();

      query(
        '.tex-block',
        (el: BlockElement) => {
          const range = selectionApi.getRange();

          if (range) {
            const focusedBlock = closest(range?.commonAncestorContainer, el);

            if (focusedBlock) {
              const index = blockManager.getIndex(focusedBlock),
                model = blockManager.getModel(index);

              this.setIndex(index);

              if (model) {
                const contentElement = model.getContentElement(),
                  blockItem = model.isEditableItems() ? model.getItemBody(-1) : null;

                const element = blockItem || contentElement,
                  [start, end] = selectionApi.getOffset(element);

                if (element) {
                  selectionApi.setState({
                    element: element,
                    position: {
                      start: start,
                      end: end,
                    },
                  });
                }

                if (range && model) {
                  executeMethodIfExists(model, '__onSelectionChange', [evt, range]);

                  if (!range.collapsed && model.isVisibleTools()) {
                    tools.show();
                    tools.syncHighlight();
                  } else {
                    tools.hide();
                  }
                }
              }
            }
          }
        },
        root,
      );

      this.trigger('onSelectionChangeEnd', { domEvent: evt });
    }
  }

  /**
   * Provides the parent component with access to the child's current editor instance.
   * Returns the editor object if initialized, or `null` otherwise.
   */
  protected provideEditor(): Texditor | null {
    return this.editor;
  }

  /** @see IEvents.destroy */
  destroy(): void {
    const root = this.editor.getRoot(),
      eid = this.eventId;

    off(document, 'click.docEvt' + eid, true);
    off(document, 'dblclick.docEvt' + eid, true);
    off(document, 'keydown.docEvt' + eid, true);

    if (!root) return;

    query(
      '.tex-block',
      (el: HTMLElement) => {
        off(el, 'keydown.e');
        off(el, 'keyup.e');
        off(el, 'paste.e');
        off(el, 'dragstart.e');
        off(el, 'dragleave.e');
        off(el, 'dragover.e');
        off(el, 'drag.e1');
        off(el, 'drop.e1');
        off(el, 'dragend.e');
        off(el, 'focus.e');
        off(el, 'blur.e');
        off(el, 'click.e');
      },
      root,
    );

    off(document, 'selectionchange.e' + this.eventId);
  }
}
