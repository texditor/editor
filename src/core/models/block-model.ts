import type {
  BlockElement,
  BlockSchema,
  SanitizerConfig,
  BlockModelConfig,
  BlockModel as IBlockModel,
  BlockCreateSchema,
  BlockCreateItemSchema,
  PasteMap,
  BaseEvent,
  BlockModelConstructor,
  TexditorEvent,
  ActionModelConstructor,
} from "@/types";
import {
  addClass,
  after,
  append,
  appendText,
  attr,
  closest,
  css,
  data,
  getLength,
  html,
  make,
  prepend,
  query,
  queryList,
  removeClass
} from "@/utils/dom";
import Sanitizer from "../security/sanitizer";
import { renderIcon } from "@/utils/icon";
import {
  executeMethodIfExists,
  generateRandomString,
  isEmptyString,
  off,
  on,
  rebind
} from "@/utils";
import { IconBars, IconMove } from "@/icons";
import BaseModel from "../base/base-model";
import Sortable from "sortablejs";

/**
 * Base block model class - manages block behavior, content, and lifecycle
 */
export default class BlockModel extends BaseModel<BlockElement> implements IBlockModel {
  /** Sortable items manager instance */
  private sortableItems: Sortable | null = null;

  /**
  * Set up global configuration
  * @param config - Partial configuration
  * @returns Model constructor
  */
  public static setup(
    config: Partial<BlockModelConfig>
  ): BlockModelConstructor {
    return super.setup(config) as BlockModelConstructor;
  }

  protected change(
    name: string,
    params: TexditorEvent = {},
    globalParams: TexditorEvent = {}
  ): void {
    const { events } = this.editor;
    const finallyParams = {
      ...{
        type: name,
        modelCode: this.getModelCode(),
      },
      ...params
    };

    if (Object.keys(globalParams).length) {
      events.change({ ...finallyParams, ...globalParams });
    }

    this.triggerEvent(name, finallyParams);
    this.triggerEvent("onChange", finallyParams);
  }

  /**
  * Parent model configuration
  * @returns Parent model configuration
  */
  protected parentConfig(): Partial<BlockModelConfig> {
    return {
      __modelCode: 'block',
      autoMerge: true,
      autoParse: true,
      icon: "",
      visibleIcon: false,
      translation: "",
      groupCode: '',
      contentClassName: '',
      itemTagName: 'li',
      itemName: 'li',
      itemRelatedNames: [],
      itemClassName: "",
      itemBodyClassName: "",
      backspaceRemove: true,
      className: "",
      visibleTools: false,
      availableTools: [],
      editable: false,
      editableItems: false,
      singleItem: false,
      enterCreate: true,
      raw: false,
      sanitizer: false,
      sanitizerConfig: {
        elements: ["b", "a", "i", "s", "u", "sup", "sub", "mark", "code"],
        attributes: {
          a: ["href", "target"]
        },
        protocols: {
          a: {
            href: ["https", "ftp", "http", "mailto"]
          }
        }
      },
      tagName: "div",
      relatedNames: [],
      emptyDetect: false,
      customSave: false,
      normalize: false,
      convertible: false,
      sortableItems: false,
      dragZoneClassName: 'tex-item-drag-zone-default',
      visibleTitle: false,
      attributeTitle: false
    }
  }

  /**
   * Parent hook called after model node creation
   * @param el - Created model node
   * @returns void
   */
  protected parentOnCreateElement(el: BlockElement): void {
    const { config, i18n } = this.editor,
      tagName = this.getTagName(),
      contentClassName = this.getContentClassName(),
      elements = [];

    const blockActions = config.get("actions", []) as ActionModelConstructor[];

    if (blockActions.length) {
      const actionsElement = make('div', (actions: HTMLDivElement) => {
        const cssName = 'tex-actions';
        addClass(actions, cssName);

        const contentElement = make('div', (content: HTMLDivElement) => {
          const contentCss = cssName + "-content";
          addClass(content, contentCss + ' tex-animate-fadeIn');

          const contentBody = make('div', (body: HTMLDivElement) => {
            addClass(body, contentCss + '-body');
          });

          const contentMenu = make('div', (menu: HTMLDivElement) => {
            addClass(menu, contentCss + '-dropdown');
          });

          append(content, [contentBody, contentMenu]);
        });

        const openBtn = make('div', (btn: HTMLDivElement) => {
          addClass(btn, cssName + "-btn tex-animate-fadeIn");
          attr(btn, 'title', i18n.get('actions', 'Actions'));
          html(
            btn,
            renderIcon(IconBars, {
              width: 14,
              height: 14
            })
          );

          on(btn, 'click.open', () => this.showActions());
        })

        append(actions, [openBtn, contentElement]);
      });

      elements.push(actionsElement);
    }

    const contentElement = make(tagName, (content: HTMLDivElement) => {
      addClass(content, 'tex-block-content' + (contentClassName ? ' ' + contentClassName : ''));
      if (this.isEmptyDetect()) data(content, 'empty', 'true');
      if (this.isEditable()) content.contentEditable = "true";

      const placeholder = this.getPlaceholder()

      if (placeholder && !isEmptyString(placeholder))
        data(content, 'placeholder', placeholder);
    });

    elements.push(contentElement);

    append(el, elements);
  }

  /** @see IBlockModel.showActions */
  showActions(): void {
    this.hideActions();

    const { config } = this.editor,
      eid = this.getEventId(),
      cssName = '.tex-actions',
      blockElement = this.getElement();

    const [actionsElement] = queryList(cssName, blockElement);

    if (actionsElement) {
      const blockActions = config.get("actions", []) as ActionModelConstructor[];
      query(cssName + '-content', (content: HTMLDivElement) => {
        const [contentBody] = queryList(cssName + '-content-body', content);
        if (contentBody) {
          blockActions.forEach((instance: ActionModelConstructor) => {
            const action = new instance(this.editor);
            executeMethodIfExists(action, '__setBlockElement', [this.getElement()])
            const actionEl = action.getElement(),
              isVisible = action.isVisible();

            append(contentBody, actionEl);
            css(actionEl, 'display', isVisible ? "" : "none");
            executeMethodIfExists(action, '__onMount', [actionEl]);
          });

          css(content, "display", "block");
        }
      }, blockElement);

      rebind(
        document,
        "click.actions" + eid,
        (evt) => {
          if (!closest(evt.target, actionsElement)) {
            this.hideActions();
          }
        },
        true
      );
    }
  }

  /** @see IBlockModel.hideActions */
  hideActions(): void {
    const eid = this.getEventId(),
      cssName = '.tex-actions',
      blockElement = this.getElement();

    const [actionsElement] = queryList(cssName, blockElement);

    if (actionsElement) {
      off(document, "click.actions" + eid);
      query(cssName + '-content', (content: HTMLDivElement) => {
        query(
          cssName + '-content-body',
          (contentBody: HTMLDivElement) => html(contentBody, ''),
          content
        );
        query(
          cssName + '-content-dropdown',
          (contentDropdown: HTMLDivElement) => {
            html(contentDropdown, '');
            removeClass(contentDropdown, 'tex-active');
          },
          content
        );
        css(content, "display", "");
      }, blockElement);
    }
  }

  /**
   * Refresh sortable items functionality 
   */
  protected refreshSortableItems(): void {
    const { blockManager, selectionApi } = this.editor;
    if (this.isSortableItems()) {
      if (this.sortableItems) {
        this.sortableItems.destroy();
      }

      const contentElement = this.getContentElement();

      if (contentElement) {
        this.sortableItems = new Sortable(contentElement, {
          handle: '.tex-item-drag-zone',
          ghostClass: 'tex-sortable-item',
          chosenClass: 'tex-sortable-chosen',
          forceFallback: true,
          swap: false,
          delay: 0,
          dragoverBubble: false,
          animation: 250,
          sort: true,
          direction: 'vertical',
          onStart: () => {
            blockManager.destroyVirtualSelection();
          },
          onEnd: (evt) => {
            blockManager.refreshVirtualSelection();

            this.change('moveListItem', {
              item: evt.item,
              index: evt.newIndex,
              targetIndex: evt.oldIndex
            }, {
              blockElement: this.getElement(),
              contentElement: contentElement,
            });

            setTimeout(() => {
              blockManager.refreshVirtualSelection();
              const itemBody = this.getItemBody(evt.newIndex || 0);
              if (itemBody) {
                if (attr(itemBody, 'contentEditable') == 'true') {
                  const length = getLength(itemBody);
                  selectionApi.select(length, length, itemBody);
                } else {
                  itemBody.click();
                }
              }
            }, 5);
          }
        });
      }
    }
  }

  /**
   * Composes content from schema before mounting
   * @param composeSchema - Composition schema
   * @returns Composed block node
   */
  protected compose(createSchema?: BlockCreateSchema): BlockElement {
    const contentElement = this.getContentElement();

    if (!this.isEditable() && this.isEditableItems()) {
      const content = createSchema?.data || {};

      if (!Object.keys(content).length) {
        append(contentElement, this.__makeItemElement());
      } else if (Array.isArray(content) && content.length) {
        content.forEach((item: BlockCreateItemSchema) => {
          if (!isEmptyString(item.data)) {
            append(contentElement, [this.__makeItemElement(item.data)]);
          }
        })
      }
    } else {
      const content = createSchema?.data || '';

      if (content && typeof content === 'string') {
        if (this.isRaw()) {
          appendText(contentElement, content);
        } else {
          html(contentElement, content);
        }
      }
    }

    return this.getElement();
  }

  /**
   * Hook triggered after composition is complete
   * @param _createSchema - Composition schema used for composition
   */
  protected onCompose(_createSchema?: BlockCreateSchema): void { }

  /**
   * Prepares the unit before mounting
   * @param composeSchema - Composition schema
   * @returns Composed block node
   */
  __compose(createSchema?: BlockCreateSchema): BlockElement {
    this.sanitize();

    if (
      typeof createSchema === 'object' &&
      Object.keys(createSchema).length
    ) {
      this.setOptions(createSchema);
    }

    const blockElement = this.compose(createSchema);

    this.onCompose(createSchema);

    this.change('onCompose', {
      createSchema: createSchema
    });

    return blockElement;
  }

  /**
   * Parses block schema preparing it for composition
   * @param item - Block schema
   * @returns Composition schema
   */
  protected parse(item: BlockSchema): BlockCreateSchema {
    return item;
  }

  /**
   * Public wrapper for parse method
   * @param item - Block schema
   * @returns Composition schema
   */
  __parse(item: BlockSchema): BlockCreateSchema {
    const createSchema = this.parse(item);

    this.change('parse', {
      createSchema: createSchema
    });

    return createSchema;
  }

  /** @see IBlockModel.getTagName */
  getTagName(): string {
    return this.getConfig("tagName", '');
  }

  /** @see IBlockModel.getPlaceholder */
  getPlaceholder(): string {
    return this.getConfig('placeholder', '');
  }

  /** @see IBlockModel.getGroupCode */
  getGroupCode(): string {
    return this.getConfig("groupCode", 'block');
  }

  /** @see IBlockModel.getContentClassName */
  getContentClassName(): string {
    return this.getConfig("contentClassName", '');
  }

  /** @see IBlockModel.getContentElement */
  getContentElement(): HTMLElement {
    const block = this.getElement();
    const [contentElement] = queryList(".tex-block-content", block);

    return contentElement;
  }

  /** @see IBlockModel.isAutoMerge */
  isAutoMerge(): boolean {
    return this.getConfig("autoMerge", true);
  }

  /** @see IBlockModel.isAutoParse */
  isAutoParse(): boolean {
    return this.getConfig("autoParse", true);
  }

  /** @see IBlockModel.isEnterCreate */
  isEnterCreate(): boolean {
    return this.getConfig("enterCreate", true);
  }

  /** @see IBlockModel.isEmpty */
  isEmpty(): boolean {
    const contentElement = this.getContentElement();

    if (!contentElement)
      return true;

    if (this.isEditableItems()) {
      const length = this.getItemsLength(),
        itemBody = this.getItemBody(0);

      if (!itemBody)
        return true;

      return (
        length === 0 || (
          length === 1 && isEmptyString(
            html(itemBody).trim()
          )
        )
      );
    }

    const content = html(contentElement).trim();

    return (
      isEmptyString(content) ||
      content == "<br>"
    );
  }

  /** @see IBlockModel.isEmptyItem */
  isEmptyItem(index: number): boolean {
    const itemBody = this.getItemBody(index);

    if (!itemBody) {
      return true;
    }

    const htmlText = html(itemBody).trim();

    return (
      isEmptyString(htmlText) ||
      htmlText == "<br>"
    );
  }

  /** @see IBlockModel.isEmptyDetect */
  isEmptyDetect(): boolean {
    return this.getConfig("emptyDetect", false);
  }

  /** @see IBlockModel.isBackspaceRemove */
  isBackspaceRemove(): boolean {
    return this.getConfig("backspaceRemove", true);
  }

  /** @see IBlockModel.isEditable */
  isEditable(): boolean {
    return this.getConfig("editable", false);
  }

  /** @see IBlockModel.isEditableItems */
  isEditableItems(): boolean {
    return this.getConfig("editableItems", false);
  }

  /** @see IBlockModel.isSingleItem */
  isSingleItem(): boolean {
    return this.getConfig("singleItem", false);
  }

  /** @see IBlockModel.isRaw */
  isRaw(): boolean {
    return this.getConfig("raw", false);
  }

  /** @see IBlockModel.isNormalize */
  isNormalize(): boolean {
    return this.getConfig("normalize", false);
  }

  /** @see IBlockModel.isConvertible */
  isConvertible(): boolean {
    return this.getConfig("convertible", false);
  }

  /** @see IBlockModel.isCustomSave */
  isCustomSave(): boolean {
    return this.getConfig("customSave", false);
  }

  /** @see IBlockModel.isVisibleTools */
  isVisibleTools(): boolean {
    return this.getConfig("visibleTools", false);
  }

  /** @see IBlockModel.getAvailableTools */
  getAvailableTools(): string[] {
    return this.getConfig("availableTools", []) as string[];
  }

  /** @see IBlockModel.getRelatedNames */
  getRelatedNames(): string[] {
    return this.getConfig("relatedNames", []) as string[];
  }

  /** @see IBlockModel.getSupportedNames */
  getSupportedNames(): string[] {
    return [this.getName(), ...this.getRelatedNames()];
  }

  /**
   * Merge block
   * @returns Merged element or null
   */
  protected merge(): HTMLElement | null {
    return null;
  }

  /**
   * Public wrapper for merge method
   * @returns Merged element or null
   */
  __merge(): HTMLElement | null {
    const node = this.merge();

    this.change('merge', {
      node: node
    });

    return node;
  }

  /** @see IBlockModel.isSanitizer */
  isSanitizer(): boolean {
    return this.getConfig("sanitizer", false);
  }

  /** @see IBlockModel.sanitize */
  sanitize(): void {
    if (this.isSanitizer()) {
      const container = this.toSanitize();

      if (container || Array.isArray(container)) {
        const sanitizerConfig = this.getSanitizerConfig(),
          sanitizer = new Sanitizer(sanitizerConfig);

        if (Array.isArray(container)) {
          container.forEach((el: HTMLElement) => {
            html(el, sanitizer.sanitize(el));
          });
        } else {
          html(container, sanitizer.sanitize(container));
        }

        this.change('sanitize', {
          node: container
        });
      }
    }
  }

  /** @see IBlockModel.toSanitize */
  toSanitize(): BlockElement | HTMLElement | HTMLElement[] | null {
    if (this.isEditableItems()) {
      const bodyNodes: HTMLElement[] = [];
      let i = 0;

      this.getItems().forEach(() => {
        const itemBody = this.getItemBody(i);

        if (itemBody)
          bodyNodes.push(itemBody);

        i++;
      });

      return bodyNodes;
    }

    return this.getContentElement();
  }

  /** @see IBlockModel.getSanitizerConfig */
  getSanitizerConfig(): SanitizerConfig {
    return this.getConfig(
      "sanitizerConfig",
      {}
    ) as SanitizerConfig
  }

  /** @see IBlockModel.toNormalize */
  toNormalize(): BlockElement | HTMLElement | HTMLElement[] | null {
    return this.toSanitize();
  }

  /** @see IBlockModel.getItemTagName */
  getItemTagName(): string {
    return this.getConfig("itemTagName", "li");
  }

  /** @see IBlockModel.getItemClassName */
  getItemClassName(): string {
    return this.getConfig("itemClassName", "");
  }

  /** @see IBlockModel.getItemBodyClassName */
  getItemBodyClassName(): string {
    return this.getConfig("itemBodyClassName", "");
  }

  /** @see IBlockModel.getItemName */
  getItemName(): string {
    return this.getConfig("itemName", "li");
  }

  /** @see IBlockModel.getItemRelatedNames */
  getItemRelatedNames(): string[] {
    return this.getConfig("itemRelatedNames", []) as string[];
  }

  /** @see IBlockModel.getItemSupportedNames */
  getItemSupportedNames(): string[] {
    return [this.getItemName(), ...this.getItemRelatedNames()];
  }

  /** @see IBlockModel.isSortableItems */
  isSortableItems(): boolean {
    return this.getConfig("sortableItems", false);
  }

  /** @see IBlockModel.getDragZoneClassName */
  getDragZoneClassName(): string {
    return this.getConfig('dragZoneClassName', 'tex-item-drag-zone-default');
  }

  /** @see IBlockModel.getItems */
  getItems(): HTMLElement[] {
    const contentElement = this.getContentElement();

    if (!contentElement) return [];

    return queryList(':scope > *', contentElement);
  }

  /** @see IBlockModel.getItemsLength */
  getItemsLength(): number {
    return this.getItems().length;
  }

  /**
   * Create drag zone element for sorting
   * @returns Drag zone element
   */
  protected makeItemDragZone(): HTMLSpanElement {
    return make('span', (span: HTMLSpanElement) => {
      addClass(span, 'tex-item-drag-zone ' + this.getDragZoneClassName());
      html(span,
        renderIcon(
          IconMove,
          {
            width: 14,
            height: 14
          }
        )
      )
    });
  }

  /**
   * Creates an item element.
   * @param content - Item content.
   * @returns The item element.
   */
  protected makeItemElement(content: string | unknown = ''): HTMLElement {
    const tagName = this.getItemTagName(),
      type = this.getItemName(),
      className = this.getItemClassName(),
      bodyClassName = this.getItemBodyClassName();

    return make(tagName, (el: HTMLElement) => {
      addClass(el, 'tex-item ' + className);
      el.id = this.getId() + "-" + type + "-" + generateRandomString(8);

      const body = make('div', (div: HTMLDivElement) => {
        addClass(div, 'tex-item-body ' + bodyClassName);

        if (this.isEditableItems())
          attr(div, 'contentEditable', 'true');

        if (typeof content === 'string') {
          const textContent = isEmptyString(content || "") ? "" : content || "";

          if (this.isRaw()) {
            html(div, '');
            appendText(div, textContent);
          } else
            html(div, textContent);
        }
      });

      append(el, body);

      if (this.isSortableItems()) {
        const dragZone = this.makeItemDragZone();
        append(el, dragZone);
      }
    });
  }

  /**
   * Public wrapper for makeItemElement
   * @param content - Item content
   * @returns Item element
   */
  __makeItemElement(content: string | unknown = ''): HTMLElement {
    const node = this.makeItemElement(content);

    this.change('makeItemElement', {
      node: node,
      content: content
    });

    return node;
  }

  /** @see IBlockModel.createItem */
  createItem(
    content?: string | unknown,
    index: number = -1,
    skipEvents: boolean = false
  ): boolean {
    const contentElement = this.getContentElement();

    if (!contentElement)
      return false;

    const itemElement = this.__makeItemElement(content);

    if (index === 0) {
      prepend(contentElement, itemElement)
    } else if (index === -1) {
      const item = this.getItem(-1);

      if (item)
        after(item, itemElement);
      else
        append(contentElement, itemElement);
    } else {
      const prevIndex = index - 1;
      if (prevIndex < 0) {
        prepend(contentElement, itemElement);
      } else {
        const item = this.getItem(prevIndex);

        if (item)
          after(item, itemElement);
        else {
          append(contentElement, itemElement);
        }
      }
    }

    this.refreshSortableItems();

    const newIndex = this.getItemIndex(itemElement);
    const itemBody = this.getItemBody(newIndex);

    if (!skipEvents) {
      if (itemBody) {
        if (attr(itemBody, 'contentEditable') == 'true') {
          itemBody.focus();
        } else
          itemBody.click();
      }

      this.change('createItem', {
        index: newIndex
      }, {
        contentElement: contentElement,
        blockElement: this.getElement(),
      });
    }

    return true;
  }

  /** @see IBlockModel.moveItem */
  moveItem(
    index: number,
    targetIndex: number,
    skipEvents: boolean = false
  ): void {
    const contentElement = this.getContentElement();

    if (!contentElement) return;

    const itemsLength = this.getItemsLength();

    if (itemsLength === 0) return;

    let realIndex = index;
    if (realIndex < 0) realIndex = 0;
    if (realIndex >= itemsLength) realIndex = itemsLength - 1;

    let realTargetIndex = targetIndex;
    if (realTargetIndex <= 0) {
      realTargetIndex = 0;
    } else if (realTargetIndex >= itemsLength) {
      realTargetIndex = itemsLength - 1;
    }

    if (realIndex === realTargetIndex) return;

    const itemElement = this.getItem(realIndex);

    if (!itemElement) return;

    itemElement.remove();

    if (realTargetIndex === 0) {
      prepend(contentElement, itemElement);
    } else {
      if (realTargetIndex >= itemsLength - 1) {
        append(contentElement, itemElement);
      } else {
        const insertAfterIndex = realTargetIndex - 1;
        const targetItemElement = this.getItem(insertAfterIndex);

        if (targetItemElement) {
          after(targetItemElement, itemElement);
        } else {
          append(contentElement, itemElement);
        }
      }
    }

    if (!skipEvents) {
      this.change('moveItem', {
        item: itemElement,
        index: index,
        targetIndex: realTargetIndex
      }, {
        contentElement: contentElement,
        blockElement: this.getElement(),
      });
    }
  }

  /** @see IBlockModel.removeItem */
  removeItem(index: number = -1): boolean {
    const item = this.getItem(index) as HTMLElement;
    const realIndex = this.getItemIndex(item) || 0;

    if (!item)
      return false;

    item.remove();

    this.change('removeItem', {
      index: realIndex
    }, {
      contentElement: this.getContentElement(),
      blockElement: this.getElement(),
    });

    return true;
  }

  /** @see IBlockModel.getItem */
  getItem(
    index: number
  ): HTMLElement | null {
    const items = this.getItems();

    if (!items.length)
      return null;

    if (index === -1) {
      let itemElement = null;
      const selection = this.editor.selectionApi.getRange();

      if (!selection) return items[0] || null;

      items.forEach((item: HTMLElement) => {
        if (selection.intersectsNode(item)) {
          itemElement = item;
        }
      });

      return itemElement;
    }

    return items[index] || null;
  }

  /** @see IBlockModel.getItemBody */
  getItemBody(
    index: number
  ): HTMLElement | null {
    const item = this.getItem(index);

    if (!item) return null;

    const [itemBody] = queryList('.tex-item-body', item);

    return itemBody || null;
  }

  /** @see IBlockModel.getItemIndex */
  getItemIndex(itemElement?: HTMLElement): number {
    let index = 0;
    const items = this.getItems(),
      node = itemElement || this.getItem(-1);

    if (items.length && node) {
      items.forEach((
        item: HTMLElement,
        itemIndex: number
      ) => {
        if (item == node) {
          index = itemIndex;
        }
      });
    }

    return index;
  }

  /**
   * Saves block data to output format.
   * @param blockSchema - Block schema
   * @param _blockElement - Block element
   * @returns The modified block output.
   */
  protected save(
    blockSchema: BlockSchema,
    _blockElement?: BlockElement
  ): BlockSchema {
    return blockSchema;
  }

  /**
   * Public wrapper for save method
   * @param block - Block output object
   * @param blockElement - Block node (optional)
   * @returns Modified block output
   */
  __save(
    block: BlockSchema,
    blockElement?: BlockElement
  ): BlockSchema {
    const blockSchema = this.save(block, blockElement);
    this.triggerEvent('save', {
      type: 'save',
      modelCode: this.getModelCode(),
      blockSchema: blockSchema
    });

    return blockSchema;
  }

  /**
   * Parent hook called after mounting to the DOM
   */
  protected parentOnMount(): void {
    this.refreshSortableItems();
  }

  /**
   * Handle paste event
   * @param _evt - Paste event
   * @param _map - Paste data map
   * @returns True to allow paste
   */
  protected onPaste(
    _evt: Event,
    _map: PasteMap,
  ): boolean {
    return true;
  }

  /**
   * Public wrapper for onPaste
   * @param evt - Paste event
   * @param map - Paste data map
   * @returns True to allow paste
   */
  __onPaste(evt: Event, map: PasteMap) {
    const status = this.onPaste(evt, map);

    this.change('onPaste', {
      domEvent: evt,
      status: status,
      map: map
    });

    return status;
  }

  /**
   * Handles a DOM event by executing the corresponding handler if present
   * @param name - Event name
   * @param evt - The DOM event object
   * @returns Whether a handler was executed
   */
  private defEvent(name: string, evt: Event | BaseEvent): boolean {
    const __name = 'on' + name;
    const status = !!executeMethodIfExists(this, __name, [evt]);

    if (!status)
      evt.preventDefault();

    this.change(__name, {
      domEvent: evt,
      status: status
    });

    return status;
  }

  /**
   * Handle key down event
   * @param _evt - Keyboard event
   * @returns True to allow default behavior
   */
  protected onKeyDown(_evt: KeyboardEvent): boolean {
    return true;
  }

  /**
   * Public wrapper for onKeyDown
   * @param evt - Keyboard event
   * @returns True to allow default behavior
   */
  __onKeyDown(evt: KeyboardEvent): boolean {
    return this.defEvent('KeyDown', evt);
  }

  /**
   * Handle key up event
   * @param _evt - Keyboard event
   * @returns True to allow default behavior
   */
  protected onKeyUp(_evt: KeyboardEvent): boolean {
    return true;
  }

  /**
   * Public wrapper for onKeyUp
   * @param evt - Keyboard event
   * @returns True to allow default behavior
   */
  __onKeyUp(evt: KeyboardEvent): boolean {
    return this.defEvent('KeyUp', evt);
  }

  /**
   * Handle focus event
   * @param _evt - Focus event
   * @returns True to allow default behavior
   */
  protected onFocus(_evt: FocusEvent): boolean {
    return true;
  }

  /**
   * Public wrapper for onFocus
   * @param evt - Focus event
   * @returns True to allow default behavior
   */
  __onFocus(evt: FocusEvent): boolean {
    return this.defEvent('Focus', evt);
  }

  /**
   * Handle blur event
   * @param _evt - Blur event
   * @returns True to allow default behavior
   */
  protected onBlur(_evt: FocusEvent): boolean {
    return true;
  }

  /**
   * Public wrapper for onBlur
   * @param evt - Blur event
   * @returns True to allow default behavior
   */
  __onBlur(evt: FocusEvent): boolean {
    return this.defEvent('Blur', evt);
  }

  /**
   * Public wrapper for onClick
   * @param evt - Mouse event
   * @returns True to allow default behavior
   */
  __onClick(evt: BaseEvent): void {
    this.onClick(evt);
  }

  /**
   * Handle selection change event
   * @param _evt - Selection change event
   * @param _range - Current selection range
   * @returns True if selection handled
   */
  protected onSelectionChange(_evt: Event, _range: Range): boolean {
    return true;
  }

  /**
   * Public wrapper for onSelectionChange
   * @param evt - Selection change event
   * @param range - Current selection range
   * @returns True if selection handled
   */
  __onSelectionChange(evt: Event, range: Range): boolean {
    const status = this.onSelectionChange(evt, range);

    this.triggerEvent('onSelectionChange', {
      type: 'onSelectionChange',
      modelCode: this.getModelCode(),
      domEvent: evt,
      range: range,
      status: status
    });

    return status;
  }

  /**
   * Handle drag start event
   * @param _evt - Drag event
   * @returns True to allow default behavior
   */
  protected onDragStart(_evt: DragEvent): boolean {
    return true;
  }

  /**
   * Public wrapper for onDragStart
   * @param evt - Drag event
   * @returns True to allow default behavior
   */
  __onDragStart(evt: DragEvent): boolean {
    return this.defEvent('DragStart', evt);
  }

  /**
   * Handle drag leave event
   * @param _evt - Drag event
   * @returns True to allow default behavior
   */
  protected onDragLeave(_evt: DragEvent): boolean {
    return true;
  }

  /**
   * Public wrapper for onDragLeave
   * @param evt - Drag event
   * @returns True to allow default behavior
   */
  __onDragLeave(evt: DragEvent): boolean {
    return this.defEvent('DragLeave', evt);
  }

  /**
   * Handle drag over event
   * @param _evt - Drag event
   * @returns True to allow default behavior
   */
  protected onDragOver(_evt: DragEvent): boolean {
    return true;
  }

  /**
   * Public wrapper for onDragOver
   * @param evt - Drag event
   * @returns True to allow default behavior
   */
  __onDragOver(evt: DragEvent): boolean {
    return this.defEvent('DragOver', evt);
  }

  /**
   * Handle drag event
   * @param _evt - Drag event
   * @returns True to allow default behavior
   */
  protected onDrag(_evt: DragEvent): boolean {
    return false;
  }

  /**
   * Public wrapper for onDrag
   * @param evt - Drag event
   * @returns True to allow default behavior
   */
  __onDrag(evt: DragEvent): boolean {
    return this.defEvent('Drag', evt);
  }

  /**
   * Handle drag end event
   * @param _evt - Drag event
   * @returns True to allow default behavior
   */
  protected onDragEnd(_evt: DragEvent): boolean {
    return true;
  }

  /**
   * Public wrapper for onDragEnd
   * @param evt - Drag event
   * @returns True to allow default behavior
   */
  __onDragEnd(evt: DragEvent): boolean {
    return this.defEvent('DragEnd', evt);
  }

  /**
   * Handle drop event
   * @param _evt - Drag event
   * @returns True to allow default behavior
   */
  protected onDrop(_evt: DragEvent): boolean {
    return true;
  }

  /**
   * Public wrapper for onDrop
   * @param evt - Drag event
   * @returns True to allow default behavior
   */
  __onDrop(evt: DragEvent): boolean {
    return this.defEvent('Drop', evt);
  }

  /**
   * Hook called before block conversion
   * @param blockElement - Block node to convert
   * @param targetModel - Target block model
   * @returns Tuple of modified block node and target model
   */
  protected beforeConvert(
    blockElement: BlockElement,
    targetModel: BlockModel
  ): [BlockElement, BlockModel] {
    return [blockElement, targetModel];
  }

  /**
   * Public wrapper for beforeConvert
   * @param blockElement - Block node to convert
   * @param targetModel - Target block model
   * @returns Tuple of modified block node and target model
   */
  __beforeConvert(
    blockElement: BlockElement,
    targetModel: BlockModel
  ): [BlockElement, BlockModel] {
    return this.beforeConvert(blockElement, targetModel);
  }

  /**
   * Hook called after block conversion
   * @param newBlockElement - Newly converted block node
   * @returns Modified block node
   */
  protected afterConvert(
    newBlockElement: BlockElement
  ): BlockElement {
    return newBlockElement;
  }

  /**
   * Public wrapper for afterConvert
   * @param newBlockElement - Newly converted block node
   * @returns Modified block node
   */
  __afterConvert(
    newBlockElement: BlockElement
  ): BlockElement {
    return this.afterConvert(newBlockElement);
  }

  /**
   * Parent hook called before the element is destroyed
   */
  protected parentDestroy(): void {
    if (this.sortableItems) {
      this.sortableItems.destroy();
      this.sortableItems = null
    }
    const eid = this.getEventId();
    off(document, "click.actions" + eid);
  }
}