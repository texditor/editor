import type {
  BlockNode,
  TexditorInterface,
  BlockOutput,
  SanitizerConfig,
  BlockModelConfig,
  BlockModelInterface,
  SortableInerface,
  BlockCreateOptions,
  BlockCreateItemsContent
} from "@/types";
import {
  addClass,
  after,
  append,
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

export default class BlockModel implements BlockModelInterface {
  protected id: string = "";
  protected editor: TexditorInterface;
  protected store: Record<string, unknown> = {};
  private static userConfig: Partial<BlockModelConfig> = {};
  private sortableItems: SortableInerface | null = null;
  private config: Partial<BlockModelConfig> = {
    autoMerge: true,
    autoParse: true,
    autoPaste: true,
    icon: "",
    translationCode: "",
    groupCode: '',
    itemTagName: 'li',
    itemType: 'li',
    itemRelatedTypes: [],
    itemClassName: "",
    itemBodyClassName: "",
    backspaceRemove: true,
    cssClasses: "",
    toolbar: false,
    tools: [],
    editable: false,
    editableItems: false,
    singleItem: false,
    enterCreate: true,
    raw: false,
    sanitizer: false,
    sanitizerConfig: {},
    tagName: "div",
    type: "",
    relatedTypes: [],
    emptyDetect: false,
    customSave: false,
    normalize: false,
    convertible: false,
    sortableItems: false
  };

  constructor(editor: TexditorInterface) {
    this.editor = editor;
    this.config = {
      ...this.config,
      ...this.configure(),
      ...(this.constructor as typeof BlockModel).userConfig
    };
    this.onLoad();
    this.sanitize();
  }

  protected refreshSortableItems(): void {
    const { events, selectionApi } = this.editor;
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
            onEnd: (item: HTMLElement, oldIndex: number, newIndex: number) => {
              events.change({
                type: "moveListItem",
                blockNode: this.getBlockNode(),
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

  configure() {
    return this.config;
  }

  create(options?: BlockCreateOptions): HTMLElement {
    if (!this.isEditable() && this.isEditableItems()) {
      return this.make(
        this.getTagName(),
        ({ contentNode }: { contentNode: HTMLElement }) => {

          let content = options?.content || {};

          if (!options?.content) {
            append(contentNode, this.makeItemNode());
          } else if (Array.isArray(content) && content.length) {
            content.forEach((item: BlockCreateItemsContent) => {
              if (item.data && Array.isArray(item.data)) {
                const data = toHtml(item.data);
                append(contentNode, this.makeItemNode(data));
              }
            })
          }
        }
      );
    }

    return this.make(
      this.getTagName(),
      ({ contentNode }: { contentNode: HTMLElement }) => {
        if (options?.content && typeof options.content === 'string')
          contentNode.innerHTML = options.content;
      }
    );
  }


  protected make(
    tagName: string,
    callback: CallableFunction
  ): BlockNode | HTMLElement {
    const classList = this.getConfig("cssClasses", "");
    const classes = (classList ? " " + classList : " tex-" + this.getConfig("type"));

    return make('div', (blockNode: BlockNode) => {
      addClass(blockNode, "tex-block" + classes);

      blockNode.id = this.getId();
      blockNode.dataset.tagName = tagName;
      blockNode.dataset.type = this.getConfig("type");

      const contentNode = make(tagName, (content: HTMLElement) => {
        addClass(content, 'tex-block-content');
        if (this.isEmptyDetect()) content.dataset.empty = "true";
        if (this.isEditable()) content.contentEditable = "true";

        if (this.getConfig("placeholder"))
          content.dataset.placeholder = this.getConfig("placeholder");
      })

      append(blockNode, contentNode);

      Object.defineProperty(blockNode, "blockModel", {
        value: this,
        writable: true
      });

      callback({ contentNode: contentNode, blockNode: blockNode });
    })
  }

  parse(_item: BlockOutput): HTMLElement | BlockNode | null {
    return null;
  }

  getTagName(): string {
    return this.getConfig("tagName");
  }

  getType(): string {
    return this.getConfig("type");
  }

  getTranslation(): string {
    return this.editor.i18n.get(this.getTranslationCode(), this.getType());
  }

  getTranslationCode(): string {
    return this.getConfig("translationCode");
  }

  getGroupCode(): string {
    return this.getConfig("groupCode", 'block');
  }

  getIcon(width: number = 24, height: number = 24): string {
    return renderIcon(this.getConfig("icon"), {
      width: width,
      height: height
    });
  }

  getId(): string {
    if (!this.id) {
      this.id = this.createId();
      const existingElement = document.getElementById(this.id);

      if (existingElement) {
        this.id = this.createId();
      }
    }

    return this.id;
  }

  getBlockNode(): BlockNode | null {
    if (!this.id) {
      return null;
    }

    return document.getElementById(this.id) as BlockNode;
  }

  getContentNode(): HTMLElement | null {
    const block = this.getBlockNode();

    if (!block)
      return null;

    let elem = null;
    query(".tex-block-content", (el: HTMLElement) => elem = el, block);

    return elem;
  }

  getConfig(key: string, defaultValue: string): string;
  getConfig<K extends keyof BlockModelConfig>(key: K): BlockModelConfig[K];
  getConfig<K extends keyof BlockModelConfig>(
    key: K,
    defaultValue: BlockModelConfig[K]
  ): BlockModelConfig[K];
  getConfig(key: string, defaultValue: unknown): unknown;
  getConfig(
    key: keyof BlockModelConfig | string,
    defaultValue: unknown = ""
  ): unknown {
    const value = (this.config as Record<string, unknown>)[key];

    if (value !== undefined) {
      return value;
    }

    return defaultValue !== undefined ? defaultValue : "";
  }

  public static setup(config: object) {
    this.userConfig = config;

    return this;
  }

  isAutoMerge(): boolean {
    return this.getConfig("autoMerge", true);
  }

  isAutoParse(): boolean {
    return this.getConfig("autoParse", true);
  }

  isAutoPaste(): boolean {
    return this.getConfig("autoPaste", true);
  }

  isEnterCreate(): boolean {
    return this.getConfig("enterCreate", true);
  }

  isEmpty(): boolean {
    const contentNode = this.getContentNode();

    if (!contentNode)
      return true;

    if (this.isEditableItems()) {
      return this.getItemsLength() === 0;
    }

    const html = contentNode.innerHTML.trim();

    return (
      isEmptyString(html) ||
      html == "<br>"
    );
  }

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

    return false;
  }

  isEmptyDetect(): boolean {
    return this.getConfig("emptyDetect", false);
  }

  isBackspaceRemove(): boolean {
    return this.getConfig("backspaceRemove");
  }

  isEditable(): boolean {
    return this.getConfig("editable");
  }

  isEditableItems(): boolean {
    return this.getConfig("editableItems", false);
  }

  isSingleItem(): boolean {
    return this.getConfig("singleItem", false);
  }

  isRaw(): boolean {
    return this.getConfig("raw");
  }

  isNormalize(): boolean {
    return this.getConfig("normalize", false);
  }

  isConvertible(): boolean {
    return this.getConfig("convertible", false);
  }

  isCustomSave(): boolean {
    return this.getConfig("customSave", false);
  }

  isToolbar(): boolean {
    return this.getConfig("toolbar", false);
  }

  getTolls(): string[] {
    return this.getConfig("tools", []) as string[];
  }

  getRelatedTypes(): string[] {
    return this.getConfig("relatedTypes", []);
  }

  protected createId(): string {
    const array = new Uint8Array(8);
    crypto.getRandomValues(array);
    const randomHex = Array.from(array, (byte) =>
      byte.toString(16).padStart(2, "0")
    ).join("");

    return `${this.getType()}-${randomHex}-${Date.now().toString(36)}`;
  }

  merge(): HTMLElement | null {
    return null;
  }

  protected onLoad(): void { }

  sanitize() {
    if (this.getConfig("sanitizer", false)) {
      const container = this.sanitizerContainer();
      if (container || Array.isArray(container)) {
        const sanitizerConfig: SanitizerConfig = this.getConfig(
          "sanitizerConfig",
          {}
        ),
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

  sanitizerContainer(): BlockNode | HTMLElement | HTMLElement[] | null {
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

  normalizeContainer(): BlockNode | HTMLElement | HTMLElement[] | null {
    return this.sanitizerContainer();
  }

  // Items
  getItemTagName(): string {
    return this.getConfig("itemTagName", "li");
  }

  getItemClassName(): string {
    return this.getConfig("itemClassName", "");
  }

  getItemBodyClassName(): string {
    return this.getConfig("itemBodyClassName", "");
  }

  getItemType(): string {
    return this.getConfig("itemType", "li");
  }

  getItemRelatedTypes(): string[] {
    return this.getConfig("itemRelatedTypes", []);
  }

  isSortableItems(): boolean {
    return this.getConfig("sortableItems", false);
  }

  getItems(): HTMLElement[] {
    const contentNode = this.getContentNode();

    if (!contentNode) return [];

    return queryList(':scope > *', contentNode);
  }

  getItemsLength(): number {
    return this.getItems().length;
  }

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

  makeItemNode(content: string = ''): HTMLElement {
    const tagName = this.getItemTagName(),
      type = this.getItemType(),
      className = this.getItemClassName(),
      bodyClassName = this.getItemBodyClassName();

    return make(tagName, (el: HTMLElement) => {
      addClass(el, 'tex-item ' + className);
      el.id = this.getId() + "-" + type + "-" + generateRandomString(8);

      const body = make('div', (div: HTMLDivElement) => {
        addClass(div, bodyClassName);

        if (this.isEditableItems())
          attr(div, 'contenteditable', 'true');

        html(div, isEmptyString(content ?? "") ? "<br>" : content || "")
      });

      append(el, body);

      if (this.isSortableItems()) {
        const dragZone = this.makeItemDragZone();
        append(el, dragZone);
      }
    });
  }

  createItem(
    content?: string,
    index: number = -1,
  ): boolean {
    const contentNode = this.getContentNode();

    if (!contentNode)
      return false;

    const itemNode = this.makeItemNode(content);

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

  removeItem(index: number = -1): boolean {
    const item = this.getItem(index) as HTMLElement;

    if (!item)
      return false;

    item.remove()

    const length = this.getItemsLength();

    if (!length) {
      this.getBlockNode()?.remove()
    }

    return true;
  }

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

  protected onCreate(_newBlockNode?: BlockNode | null) { }

  onRender(): void { }

  save(
    block: BlockOutput,
    _blockNode?: BlockNode
  ): BlockOutput {
    return block;
  }

  afterCreate(newBlockNode?: BlockNode | null) {
    this.onCreate(newBlockNode);
    this.refreshSortableItems();
    this.sanitize();
  }

  setStore(key: string, value: unknown): this {
    this.store[key] = value;

    return this;
  }

  getStore(key: string | null): unknown {
    return key === null ? this.store : this.store[key] || null;
  }

  onPaste(_evt: Event, _input: Node[]): void { }

  beforeConvert(
    blockNode: BlockNode,
    targetModel: BlockModelInterface
  ): [BlockNode, BlockModelInterface] {
    return [blockNode, targetModel];
  }

  afterConvert(
    newBlockNode: BlockNode
  ): BlockNode {
    return newBlockNode;
  }

  destroy(): void { }
}
