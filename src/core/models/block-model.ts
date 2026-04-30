import type {
  BlockNode,
  BlockSchema,
  SanitizerConfig,
  BlockModelConfig,
  BlockModelInterface,
  SortableInerface,
  BlockCreateSchema,
  BlockCreateItemSchema,
  PasteMap,
  BaseEvent,
  BlockModelConstructor,
} from "@/types";
import {
  addClass,
  after,
  append,
  appendText,
  attr,
  data,
  getLength,
  html,
  make,
  prepend,
  queryList
} from "@/utils/dom";
import Sanitizer from "../security/sanitizer";
import { renderIcon } from "@/utils/icon";
import { generateRandomString, isEmptyString } from "@/utils";
import { IconMove } from "@/icons";
import Sortable from "../ui/sortable";
import BaseModel from "./base-model";

/**
 * Base block model class - manages block behavior, content, and lifecycle
 */
// TODO: BlockModel<TConfig>
export default class BlockModel extends BaseModel<BlockNode> implements BlockModelInterface {
  /** Sortable items manager instance */
  private sortableItems: SortableInerface | null = null;

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

  /**
  * Parent model configuration
  * @returns Parent model configuration
  */
  protected parentСonfig(): Partial<BlockModelConfig> {
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
      tools: [],
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
      type: "",
      relatedNames: [],
      emptyDetect: false,
      customSave: false,
      normalize: false,
      convertible: false,
      sortableItems: false,
      dragzoneClassName: 'tex-item-dragzone-default',
      visibleTitle: false,
      attributeTitle: false
    }
  }

  /**
   * Parent hook called after model node creation
   * @param el - Created model node
   * @returns void
   */
  protected parentOnCreateNode(el: BlockNode): void {
    const tagName = this.getTagName(),
      contentClassName = this.getContentClassName();
    const contentNode = make(tagName, (content: HTMLElement) => {
      addClass(content, 'tex-block-content' + (contentClassName ? ' ' + contentClassName : ''));
      if (this.isEmptyDetect()) data(content, 'empty', 'true');
      if (this.isEditable()) content.contentEditable = "true";

      const placeholder = this.getPlaceholder()

      if (placeholder && !isEmptyString(placeholder))
        data(content, 'placeholder', placeholder);
    });

    append(el, contentNode);
  }

  /**
   * Refresh sortable items functionality 
   */
  protected refreshSortableItems(): void {
    const { blockManager, events, selectionApi } = this.editor;
    if (this.isSortableItems()) {
      setTimeout(() => {
        if (this.sortableItems) {
          this.sortableItems.destroy();
        }

        const contentNode = this.getContentNode();

        if (contentNode) {
          this.sortableItems = new Sortable(contentNode, {
            itemSelector: '.tex-item',
            handleSelector: '.tex-item-dragzone',
            onStart: () => {
              blockManager.destroyVirtualSelection();
            },
            onEnd: (item: HTMLElement, oldIndex: number, newIndex: number) => {
              events.change({
                type: "moveListItem",
                blockNode: this.getNode(),
                contentNode: contentNode,
                item: item,
                index: newIndex,
                targetIndex: oldIndex
              });

              setTimeout(() => {
                const itemBody = this.getItemBody(newIndex);

                if (itemBody) {
                  if (attr(itemBody, 'contenteditable') == 'true') {
                    const length = getLength(itemBody);
                    selectionApi.select(length, length, itemBody);
                  } else
                    itemBody.click();
                }
              }, 5);
            }
          });
        }
      }, 5);
    }
  }

  /**
   * Composes content from schema before mounting
   * @param composeSchema - Composition schema
   * @returns Composed block node
   */
  protected compose(createSchema?: BlockCreateSchema): BlockNode {
    const contentNode = this.getContentNode();

    if (!this.isEditable() && this.isEditableItems()) {
      const content = createSchema?.data || {};

      if (!Object.keys(content).length) {
        append(contentNode, this.__makeItemNode());
      } else if (Array.isArray(content) && content.length) {
        content.forEach((item: BlockCreateItemSchema) => {
          if (!isEmptyString(item.data)) {
            append(contentNode, [this.__makeItemNode(item.data)]);
          }
        })
      }
    } else {
      const content = createSchema?.data || '';

      if (content && typeof content === 'string') {
        if (this.isRaw()) {
          appendText(contentNode, content);
        } else {
          html(contentNode, content);
        }


      }
    }

    return this.getNode();
  }

  /**
   * Hook triggered after composition is complete
   * @param _createSchema - Composition schema used for composition
   */
  protected onCompose(_createSchema?: BlockCreateSchema): void { }

  /**
   * Prepares and composes block content with sanitization and option merging
   * @param composeSchema - Composition schema (options will be merged with existing)
   * @returns Composed block node
   */
  __compose(createSchema?: BlockCreateSchema): BlockNode {
    this.sanitize();

    if (
      typeof createSchema === 'object' &&
      Object.keys(createSchema).length
    ) {
      this.setOptions(createSchema)
    }

    const blockNode = this.compose(createSchema);

    this.onCompose(createSchema);

    return blockNode;
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
   * @param item - Block creation schema
   * @returns Composition schema
   */
  __parse(item: BlockSchema): BlockCreateSchema {
    return this.parse(item);
  }

  /** @see BlockModelInterface.getTagName */
  getTagName(): string {
    return this.getConfig("tagName", '');
  }

  /** @see BlockModelInterface.getPlaceholder */
  getPlaceholder(): string {
    return this.getConfig('placeholder', '');
  }

  /** @see BlockModelInterface.getGroupCode */
  getGroupCode(): string {
    return this.getConfig("groupCode", 'block');
  }

  /** @see BlockModelInterface.getContentClassName */
  getContentClassName(): string {
    return this.getConfig("contentClassName", '');
  }

  /** @see BlockModelInterface.getContentNode */
  getContentNode(): HTMLElement {
    const block = this.getNode();
    const [contentNode] = queryList(".tex-block-content", block);

    return contentNode;
  }

  /** @see BlockModelInterface.isAutoMerge */
  isAutoMerge(): boolean {
    return this.getConfig("autoMerge", true);
  }

  /** @see BlockModelInterface.isAutoParse */
  isAutoParse(): boolean {
    return this.getConfig("autoParse", true);
  }

  /** @see BlockModelInterface.isEnterCreate */
  isEnterCreate(): boolean {
    return this.getConfig("enterCreate", true);
  }

  /** @see BlockModelInterface.isEmpty */
  isEmpty(): boolean {
    const contentNode = this.getContentNode();

    if (!contentNode)
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

    const content = html(contentNode).trim();

    return (
      isEmptyString(content) ||
      content == "<br>"
    );
  }

  /** @see BlockModelInterface.isEmptyItem */
  isEmptyItem(index: number): boolean {
    const itemBody = this.getItemBody(index);

    if (!itemBody) {
      return true;
    }

    const html = itemBody.innerHTML.trim();

    return (
      isEmptyString(html) ||
      html == "<br>"
    );
  }

  /** @see BlockModelInterface.isEmptyDetect */
  isEmptyDetect(): boolean {
    return this.getConfig("emptyDetect", false);
  }

  /** @see BlockModelInterface.isBackspaceRemove */
  isBackspaceRemove(): boolean {
    return this.getConfig("backspaceRemove", true);
  }

  /** @see BlockModelInterface.isEditable */
  isEditable(): boolean {
    return this.getConfig("editable", false);
  }

  /** @see BlockModelInterface.isEditableItems */
  isEditableItems(): boolean {
    return this.getConfig("editableItems", false);
  }

  /** @see BlockModelInterface.isSingleItem */
  isSingleItem(): boolean {
    return this.getConfig("singleItem", false);
  }

  /** @see BlockModelInterface.isRaw */
  isRaw(): boolean {
    return this.getConfig("raw", false);
  }

  /** @see BlockModelInterface.isNormalize */
  isNormalize(): boolean {
    return this.getConfig("normalize", false);
  }

  /** @see BlockModelInterface.isConvertible */
  isConvertible(): boolean {
    return this.getConfig("convertible", false);
  }

  /** @see BlockModelInterface.isCustomSave */
  isCustomSave(): boolean {
    return this.getConfig("customSave", false);
  }

  /** @see BlockModelInterface.isVisibleTools */
  isVisibleTools(): boolean {
    return this.getConfig("visibleTools", false);
  }

  /** @see BlockModelInterface.getAvailableTools */
  getAvailableTools(): string[] {
    return this.getConfig("tools", []) as string[];
  }

  /** @see BlockModelInterface.getRelatedNames */
  getRelatedNames(): string[] {
    return this.getConfig("relatedNames", []) as string[];
  }

  /** @see BlockModelInterface.getSupportedNames */
  getSupportedNames(): string[] {
    return [this.getName(), ...this.getRelatedNames()];
  }

  /**
   * Merge block with adjacent block
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
    return this.merge();
  }

  /**
   * Hook called when block loads 
   */
  protected onLoad(): void { }

  /** @see BlockModelInterface.sanitize */
  sanitize(): void {
    if (this.getConfig("sanitizer", false)) {
      const container = this.toSanitize();

      if (container || Array.isArray(container)) {
        const sanitizerConfig = this.getSanitizerConfig(),
          sanitizer = new Sanitizer(sanitizerConfig);

        if (Array.isArray(container)) {
          container.forEach((el: HTMLElement) => {
            el.innerHTML = sanitizer.sanitize(el);
          });
        } else {
          container.innerHTML = sanitizer.sanitize(container);
        }
      }
    }
  }

  /** @see BlockModelInterface.toSanitize */
  toSanitize(): BlockNode | HTMLElement | HTMLElement[] | null {
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

    return this.getContentNode();
  }

  /** @see BlockModelInterface.getSanitizerConfig */
  getSanitizerConfig(): SanitizerConfig {
    return this.getConfig(
      "sanitizerConfig",
      {}
    ) as SanitizerConfig
  }

  /** @see BlockModelInterface.toNormalize */
  toNormalize(): BlockNode | HTMLElement | HTMLElement[] | null {
    return this.toSanitize();
  }

  /** @see BlockModelInterface.getItemTagName */
  getItemTagName(): string {
    return this.getConfig("itemTagName", "li");
  }

  /** @see BlockModelInterface.getItemClassName */
  getItemClassName(): string {
    return this.getConfig("itemClassName", "");
  }

  /** @see BlockModelInterface.getItemBodyClassName */
  getItemBodyClassName(): string {
    return this.getConfig("itemBodyClassName", "");
  }

  /** @see BlockModelInterface.getItemName */
  getItemName(): string {
    return this.getConfig("itemName", "li");
  }

  /** @see BlockModelInterface.getItemRelatedNames */
  getItemRelatedNames(): string[] {
    return this.getConfig("itemRelatedNames", []) as string[];
  }

  /** @see BlockModelInterface.getItemSupportedNames */
  getItemSupportedNames(): string[] {
    return [this.getItemName(), ...this.getItemRelatedNames()];
  }

  /** @see BlockModelInterface.isSortableItems */
  isSortableItems(): boolean {
    return this.getConfig("sortableItems", false);
  }

  /** @see BlockModelInterface.getDragzoneClassName */
  getDragzoneClassName(): string {
    return this.getConfig('dragzoneClassName', 'tex-item-dragzone-default');
  }

  /** @see BlockModelInterface.getItems */
  getItems(): HTMLElement[] {
    const contentNode = this.getContentNode();

    if (!contentNode) return [];

    return queryList(':scope > *', contentNode);
  }

  /** @see BlockModelInterface.getItemsLength */
  getItemsLength(): number {
    return this.getItems().length;
  }

  /**
   * Create drag zone element for sorting
   * @returns Drag zone span element
   */
  protected makeItemDragZone(): HTMLSpanElement {
    return make('span', (span: HTMLSpanElement) => {
      addClass(span, 'tex-item-dragzone ' + this.getDragzoneClassName());
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
   * Create item DOM node
   * @param content - Item content
   * @returns Item element
   */
  protected makeItemNode(content: string | unknown = ''): HTMLElement {
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
          attr(div, 'contenteditable', 'true');

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
   * Public wrapper for makeItemNode
   * @param content - Item content
   * @returns Item element
   */
  __makeItemNode(content: string | unknown = ''): HTMLElement {
    return this.makeItemNode(content);
  }

  /** @see BlockModelInterface.createItem */
  createItem(
    content?: string | unknown,
    index: number = -1,
    skipEvents: boolean = false
  ): boolean {
    const { events } = this.editor;
    const contentNode = this.getContentNode();

    if (!contentNode)
      return false;

    const itemNode = this.__makeItemNode(content);

    if (index === 0) {
      prepend(contentNode, itemNode)
    } else if (index === -1) {
      const item = this.getItem(-1);

      if (item)
        after(item, itemNode);
      else
        append(contentNode, itemNode);
    } else {
      const prevIndex = index - 1;
      if (prevIndex < 0) {
        prepend(contentNode, itemNode);
      } else {
        const item = this.getItem(prevIndex);

        if (item)
          after(item, itemNode);
        else {
          append(contentNode, itemNode);
        }
      }
    }

    this.refreshSortableItems();

    const newIndex = this.getItemIndex(itemNode);
    const itemBody = this.getItemBody(newIndex);

    if (!skipEvents) {
      if (itemBody) {
        if (attr(itemBody, 'contenteditable') == 'true') {
          itemBody.focus();
        } else
          itemBody.click();
      }

      events.change({
        type: "createItem",
        contentNode: contentNode,
        blockNode: this.getNode(),
        index: newIndex
      });
    }

    return true;
  }

  /** @see BlockModelInterface.moveItem */
  moveItem(index: number, targetIndex: number): void {
    const contentNode = this.getContentNode();

    if (!contentNode) return;

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

    const itemNode = this.getItem(realIndex);

    if (!itemNode) return;

    itemNode.remove();

    if (realTargetIndex === 0) {
      prepend(contentNode, itemNode);
    } else {
      if (realTargetIndex >= itemsLength - 1) {
        append(contentNode, itemNode);
      } else {
        const insertAfterIndex = realTargetIndex - 1;
        const targetItemNode = this.getItem(insertAfterIndex);

        if (targetItemNode) {
          after(targetItemNode, itemNode);
        } else {
          append(contentNode, itemNode);
        }
      }
    }
  }

  /** @see BlockModelInterface.removeItem */
  removeItem(index: number = -1): boolean {
    const { events } = this.editor;
    const item = this.getItem(index) as HTMLElement;
    const realIndex = this.getItemIndex(item) || 0;

    if (!item)
      return false;

    item.remove();

    events.change({
      type: "removeItem",
      contentNode: this.getContentNode(),
      blockNode: this.getNode(),
      index: realIndex
    });

    return true;
  }

  /** @see BlockModelInterface.getItem */
  getItem(
    index: number
  ): HTMLElement | null {
    const items = this.getItems();

    if (!items.length)
      return null;

    if (index === -1) {
      let itemNode = null;
      const selection = this.editor.selectionApi.getRange();

      if (!selection) return items[0] || null;

      items.forEach((item: HTMLElement) => {
        if (selection.intersectsNode(item)) {
          itemNode = item;
        }
      });

      return itemNode;
    }

    return items[index] || null;
  }

  /** @see BlockModelInterface.getItemBody */
  getItemBody(
    index: number
  ): HTMLElement | null {
    const item = this.getItem(index);

    if (!item) return null;

    const [itemBody] = queryList('.tex-item-body', item);

    return itemBody || null;
  }

  /** @see BlockModelInterface.getItemIndex */
  getItemIndex(itemNode?: HTMLElement): number {
    let index = 0;
    const items = this.getItems(),
      node = itemNode || this.getItem(-1);

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
   * Save block data to output format
   * @param block - Block output object
   * @param _blockNode - Block node (optional)
   * @returns Modified block output
   */
  protected save(
    block: BlockSchema,
    _blockNode?: BlockNode
  ): BlockSchema {
    return block;
  }

  /**
   * Public wrapper for save method
   * @param block - Block output object
   * @param blockNode - Block node (optional)
   * @returns Modified block output
   */
  __save(
    block: BlockSchema,
    blockNode?: BlockNode
  ): BlockSchema {
    return this.save(block, blockNode);
  }

  /**
   * Performs post-creation initialization
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
    return this.onPaste(evt, map)
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
    return this.onKeyDown(evt);
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
    return this.onKeyUp(evt);
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
    return this.onFocus(evt);
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
    return this.onBlur(evt);
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
   * @param _evt - Selection change event
   * @param _range - Current selection range
   * @returns True if selection handled
   */
  __onSelectionChange(_evt: Event, _range: Range): boolean {
    const { tools } = this.editor;

    const hasSelection = this.onSelectionChange(_evt, _range);

    if (hasSelection) {
      if (_range && !_range.collapsed && this.isVisibleTools()) {
        tools.show();
        tools.syncHighlight();
      } else {
        tools.hide();
      }
    }

    return hasSelection;
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
    return this.onDragStart(evt);
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
    return this.onDragLeave(evt);
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
    return this.onDragOver(evt);
  }

  /**
   * Handle drag event
   * @param _evt - Drag event
   * @returns True to allow default behavior
   */
  protected onDrag(_evt: DragEvent): boolean {
    return true;
  }

  /**
   * Public wrapper for onDrag
   * @param evt - Drag event
   * @returns True to allow default behavior
   */
  __onDrag(evt: DragEvent): boolean {
    return this.onDrag(evt);
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
    return this.onDragEnd(evt);
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
    return this.onDrop(evt);
  }

  /**
   * Hook called before block conversion
   * @param blockNode - Block node to convert
   * @param targetModel - Target block model
   * @returns Tuple of modified block node and target model
   */
  protected beforeConvert(
    blockNode: BlockNode,
    targetModel: BlockModelInterface
  ): [BlockNode, BlockModelInterface] {
    return [blockNode, targetModel];
  }

  /**
   * Public wrapper for beforeConvert
   * @param blockNode - Block node to convert
   * @param targetModel - Target block model
   * @returns Tuple of modified block node and target model
   */
  __beforeConvert(
    blockNode: BlockNode,
    targetModel: BlockModelInterface
  ): [BlockNode, BlockModelInterface] {
    return this.beforeConvert(blockNode, targetModel);
  }

  /**
   * Hook called after block conversion
   * @param newBlockNode - Newly converted block node
   * @returns Modified block node
   */
  protected afterConvert(
    newBlockNode: BlockNode
  ): BlockNode {

    return newBlockNode;
  }

  /**
   * Public wrapper for afterConvert
   * @param newBlockNode - Newly converted block node
   * @returns Modified block node
   */
  __afterConvert(
    newBlockNode: BlockNode
  ): BlockNode {
    return this.afterConvert(newBlockNode);
  }
}