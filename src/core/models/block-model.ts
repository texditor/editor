import type {
  BlockNode,
  BlockOutput,
  SanitizerConfig,
  BlockModelConfig,
  BlockModelInterface,
  SortableInerface,
  BlockCreateOptions,
  BlockCreateItemsContent,
  PasteMap,
  BaseEvent,
  BlockModelConstructor
} from "@/types";
import {
  addClass,
  after,
  append,
  appendText,
  attr,
  getLength,
  html,
  make,
  prepend,
  query,
  queryList,
  toHtml
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
export default class BlockModel extends BaseModel<BlockNode> implements BlockModelInterface {
  /** Sortable items manager instance */
  private sortableItems: SortableInerface | null = null;

  /**
  * Set up global configuration
  * @param config - Partial configuration
  * @returns Model constructor
  */
  public static setup(
    this: BlockModelConstructor,
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
      sortableItems: false
    }
  }

  /**
 * Parent hook called after model node creation
 * @param el - Created model node
 * @returns void
 */
  protected parentOnCreate(el: BlockNode): void {
    const tagName = this.getTagName();

    el.dataset.tagName = tagName;
    el.dataset.type = this.getName();

    const contentNode = make(tagName, (content: HTMLElement) => {
      addClass(content, 'tex-block-content');
      if (this.isEmptyDetect()) content.dataset.empty = "true";
      if (this.isEditable()) content.contentEditable = "true";

      const placeholder = this.getPlaceholder()

      if (placeholder && !isEmptyString(placeholder))
        content.dataset.placeholder = placeholder;
    });

    append(el, contentNode);
  }

  /**
   * Refresh sortable items functionality
   * @returns void
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
                const item = this.getItemBody(newIndex);
                if (item) {
                  const length = getLength(item);
                  selectionApi.select(length, length, item);
                }
              }, 5);
            }
          });
        }
      }, 5);
    }
  }

  /**
   * Create block content based on options
   * @param options - Optional creation parameters
   * @returns Created block node
   */
  protected create(options?: BlockCreateOptions): BlockNode {
    const contentNode = this.getContentNode();

    if (typeof options === 'object' && Object.keys(options).length) {
      this.setStore('options', options);
    }

    if (!this.isEditable() && this.isEditableItems()) {
      const content = options?.content || {};

      if (!options?.content) {
        append(contentNode, this.__makeItemNode());
      } else if (Array.isArray(content) && content.length) {
        content.forEach((item: BlockCreateItemsContent) => {
          if (item.data && Array.isArray(item.data)) {
            const data = toHtml(item.data);
            append(contentNode, this.__makeItemNode(data));
          }
        })
      }
    } else {
      if (options?.content && typeof options.content === 'string')
        if (this.isRaw()) {
          appendText(contentNode, options.content);
        } else
          html(contentNode, options.content);
    }

    return this.getNode();
  }

  /**
   * Public wrapper for create method
   * @param options - Optional creation parameters
   * @returns Created block node
   */
  __create(options?: BlockCreateOptions): BlockNode {
    return this.create(options);
  }

  /**
   * Parse block output into DOM element
   * @param _item - Block output data
   * @returns DOM element or null
   */
  protected parse(_item: BlockOutput): HTMLElement | BlockNode | null {
    return null;
  }

  /**
   * Public wrapper for parse method
   * @param item - Block output data
   * @returns DOM element or null
   */
  __parse(item: BlockOutput): HTMLElement | BlockNode | null {
    return this.parse(item)
  }

  /**
   * Get block tag name
   * @returns Tag name
   */
  getTagName(): string {
    return this.getConfig("tagName", '');
  }

  /**
   * Gets the block placeholder text
   * @returns Placeholder text (empty string if not set)
   */
  getPlaceholder(): string {
    return this.getConfig('placeholder', '');
  }

  /**
   * Get group code for categorization
   * @returns Group code
   */
  getGroupCode(): string {
    return this.getConfig("groupCode", 'block');
  }

  /**
   * Get content DOM node inside block
   * @returns Content node
   */
  getContentNode(): HTMLElement {
    const block = this.getNode();
    const [contentNode] = queryList(".tex-block-content", block);

    return contentNode;
  }

  /**
   * Check if auto-merge is enabled
   * @returns True if auto-merge enabled
   */
  isAutoMerge(): boolean {
    return this.getConfig("autoMerge", true);
  }

  /**
   * Check if auto-parse is enabled
   * @returns True if auto-parse enabled
   */
  isAutoParse(): boolean {
    return this.getConfig("autoParse", true);
  }

  /**
   * Check if Enter key creates new block
   * @returns True if Enter creates block
   */
  isEnterCreate(): boolean {
    return this.getConfig("enterCreate", true);
  }

  /**
   * Check if block is empty
   * @returns True if block is empty
   */
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

  /**
   * Check if specific item is empty
   * @param index - Item index
   * @returns True if item is empty
   */
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

  /**
   * Check if empty detection is enabled
   * @returns True if empty detection enabled
   */
  isEmptyDetect(): boolean {
    return this.getConfig("emptyDetect", false);
  }

  /**
   * Check if backspace removes block
   * @returns True if backspace removes block
   */
  isBackspaceRemove(): boolean {
    return this.getConfig("backspaceRemove", true);
  }

  /**
   * Check if block content is editable
   * @returns True if editable
   */
  isEditable(): boolean {
    return this.getConfig("editable", false);
  }

  /**
   * Check if block items are editable
   * @returns True if items editable
   */
  isEditableItems(): boolean {
    return this.getConfig("editableItems", false);
  }

  /**
   * Check if block has single item only
   * @returns True if single item
   */
  isSingleItem(): boolean {
    return this.getConfig("singleItem", false);
  }

  /**
   * Check if content is raw text
   * @returns True if raw content
   */
  isRaw(): boolean {
    return this.getConfig("raw", false);
  }

  /**
   * Check if content normalization is enabled
   * @returns True if normalization enabled
   */
  isNormalize(): boolean {
    return this.getConfig("normalize", false);
  }

  /**
   * Check if block can be converted
   * @returns True if convertible
   */
  isConvertible(): boolean {
    return this.getConfig("convertible", false);
  }

  /**
   * Check if custom save is enabled
   * @returns True if custom save enabled
   */
  isCustomSave(): boolean {
    return this.getConfig("customSave", false);
  }

  /**
   * Check if tools is enabled
   * @returns True if tools enabled
   */
  isVisibleTools(): boolean {
    return this.getConfig("visibleTools", false);
  }

  /**
   * Get list of available tools
   * @returns Array of tool names
   */
  getAvailableTools(): string[] {
    return this.getConfig("tools", []) as string[];
  }

  /**
   * Get related block names
   * @returns Array of related names
   */
  getRelatedNames(): string[] {
    return this.getConfig("relatedNames", []) as string[];
  }

  /**
   * Gets an array of all supported type names
   * @returns Array of supported type names (includes main type and related types)
   */
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
   * @returns void
   */
  protected onLoad(): void { }

  /**
   * Sanitize block content for security
   * @returns void
   */
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

  /**
   * Get content to sanitize
   * @returns Content node(s) to sanitize
   */
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

  /**
   * Gets the sanitizer configuration for block content
   * @returns Sanitizer configuration object, or empty object if not set
   */
  getSanitizerConfig(): SanitizerConfig {
    return this.getConfig(
      "sanitizerConfig",
      {}
    ) as SanitizerConfig
  }

  /**
   * Get content to normalize
   * @returns Content node(s) to normalize
   */
  toNormalize(): BlockNode | HTMLElement | HTMLElement[] | null {
    return this.toSanitize();
  }

  // Items methods

  /**
   * Get item tag name
   * @returns Item tag name
   */
  getItemTagName(): string {
    return this.getConfig("itemTagName", "li");
  }

  /**
   * Get item CSS class name
   * @returns Item class name
   */
  getItemClassName(): string {
    return this.getConfig("itemClassName", "");
  }

  /**
   * Get item body CSS class name
   * @returns Item body class name
   */
  getItemBodyClassName(): string {
    return this.getConfig("itemBodyClassName", "");
  }

  /**
   * Get item type
   * @returns Item type
   */
  getItemName(): string {
    return this.getConfig("itemName", "li");
  }

  /**
   * Get related item names
   * @returns Related item names array
   */
  getItemRelatedNames(): string[] {
    return this.getConfig("itemRelatedNames", []) as string[];
  }

  /**
   * Gets an array of all supported item type names
   * @returns Array of supported type names (includes main item type and related types)
   */
  getItemSupportedNames(): string[] {
    return [this.getItemName(), ...this.getItemRelatedNames()];
  }

  /**
   * Check if items are sortable
   * @returns True if sortable
   */
  isSortableItems(): boolean {
    return this.getConfig("sortableItems", false);
  }

  /**
   * Get all items in block
   * @returns Array of item elements
   */
  getItems(): HTMLElement[] {
    const contentNode = this.getContentNode();

    if (!contentNode) return [];

    return queryList(':scope > *', contentNode);
  }

  /**
   * Get number of items
   * @returns Item count
   */
  getItemsLength(): number {
    return this.getItems().length;
  }

  /**
   * Create drag zone element for sorting
   * @returns Drag zone span element
   */
  protected makeItemDragZone(): HTMLSpanElement {
    return make('span', (span: HTMLSpanElement) => {
      addClass(span, 'tex-item-dragzone');
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
        addClass(div, bodyClassName);

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

  /**
   * Create new item at specified index
   * @param content - Item content
   * @param index - Position index (-1 for end)
   * @returns True if created successfully
   */
  createItem(
    content?: string | unknown,
    index: number = -1,
  ): boolean {
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

    setTimeout(() => this.getItemBody(newIndex)?.focus(), 5);

    return true;
  }

  /**
   * Remove item at specified index
   * @param index - Item index (-1 for last)
   * @returns True if removed successfully
   */
  removeItem(index: number = -1): boolean {
    const item = this.getItem(index) as HTMLElement;

    if (!item)
      return false;

    item.remove()

    const length = this.getItemsLength();

    if (!length) {
      this.getNode()?.remove()
    }

    return true;
  }

  /**
   * Get item at specified index
   * @param index - Item index (-1 for last selected)
   * @returns Item element or null
   */
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

  /**
   * Get item body at specified index
   * @param index - Item index
   * @returns Item body element or null
   */
  getItemBody(
    index: number
  ): HTMLElement | null {
    const item = this.getItem(index);

    if (!item) return null;

    let itemBody = null;

    query(':scope > *', (itemChild: HTMLElement) => {

      if (itemChild.contentEditable == 'true') {
        itemBody = itemChild;
      }
    }, item)

    return itemBody;
  }

  /**
   * Get index of item
   * @param itemNode - Item element (optional)
   * @returns Item index
   */
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
   * Hook called when block renders
   * @returns void
   */
  protected onRender(): void { }

  /**
   * Public wrapper for onRender
   * @returns void
   */
  __onRender(): void {
    this.onRender();
  }

  /**
   * Save block data to output format
   * @param block - Block output object
   * @param _blockNode - Block node (optional)
   * @returns Modified block output
   */
  protected save(
    block: BlockOutput,
    _blockNode?: BlockNode
  ): BlockOutput {
    return block;
  }

  /**
   * Public wrapper for save method
   * @param block - Block output object
   * @param blockNode - Block node (optional)
   * @returns Modified block output
   */
  __save(
    block: BlockOutput,
    blockNode?: BlockNode
  ): BlockOutput {
    return this.save(block, blockNode);
  }

  /**
   * Post-creation initialization
   * @returns void
   */
  protected afterCreate() {
    this.refreshSortableItems();
    this.sanitize();
  }

  /**
   * Public wrapper for afterCreate
   * @returns void
   */
  __afterCreate() {
    this.afterCreate();
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