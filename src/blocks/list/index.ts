import { BlockModelInterface } from "@/types/core/models";
import BlockModel from "@/core/models/block-model";
import {
  queryLength,
  hasClass,
  make,
  query,
  queryList,
  append,
  addClass,
  getChildNodes,
  appendText
} from "@/utils/dom";
import { OutputBlockItem } from "@/types/output";
import { ListCreateOptions } from "@/types/blocks";
import { generateRandomString } from "@/utils/common";
import { isEmptyString } from "@/utils/string";
import "@/styles/blocks/list.css";
import { HTMLBlockElement } from "@/types/core";
import { IconList } from "@/icons";

export default class List extends BlockModel implements BlockModelInterface {
  private itemIndex: number = 0;

  configure() {
    return {
      autoParse: false,
      autoMerge: false,
      translationCode: "list",
      tagName: "ul",
      type: "ul",
      icon: IconList,
      editable: false,
      editableChilds: true,
      toolbar: true,
      sanitizer: true,
      normalize: true,
      convertible: true,
      cssClasses: "tex-list",
      sanitizerConfig: {
        elements: ["b", "a", "i", "s", "u", "sup", "sub"],
        attributes: {
          a: ["href", "target"]
        },
        protocols: {
          a: {
            href: ["https", "ftp", "http", "mailto"]
          }
        }
      }
    };
  }

  create(options?: ListCreateOptions): HTMLElement {
    return this.make(this.getTagName(), (el: HTMLElement) => {
      el.innerHTML = options?.content ? options.content : "<li></li>";

      query(
        "li",
        (liEl: HTMLElement) => {
          liEl.outerHTML = this.createItem(liEl.innerHTML).outerHTML;
        },
        el
      );
    });
  }

  sanitizerContainer(): HTMLBlockElement | HTMLElement | HTMLElement[] | null {
    const block = this.getElement();

    if (!block) return null;

    return queryList("li", block);
  }

  normalizeContainer(): HTMLBlockElement | HTMLElement | HTMLElement[] | null {
    return this.sanitizerContainer();
  }

  editableChild(container?: HTMLElement | null, isCreate: boolean = false): HTMLElement | HTMLElement[] | null {
    const listContainer = container ?? this.getCurrentBlock();
    if (!listContainer) return null;

    const selection = this.editor.selectionApi.getRange();
    if (!selection) return this.getItem(0);

    let activeLi: HTMLElement | null = null;
    const items = listContainer.querySelectorAll<HTMLElement>(".tex-list-item");

    items.forEach((li, index) => {
      if (isCreate) {
        if (index == 0) activeLi = li;
      } else {
        if (selection.intersectsNode(li)) {
          activeLi = li;
        }
      }
    });

    return activeLi ?? this.getItem(0);
  }

  private getActiveListItem(): HTMLElement | null {
    const selection = this.editor.selectionApi.getRange();
    if (!selection) return null;

    const listContainer = this.getCurrentBlock();

    if (!listContainer) return null;

    const items = listContainer.querySelectorAll<HTMLElement>(".tex-list-item"),
      itemsArray = Array.from(items);

    for (const item of itemsArray) {
      if (selection.intersectsNode(item)) {
        return item;
      }
    }
    return null;
  }

  createItem(content?: string): HTMLElement {
    return make("li", (el: HTMLElement) => {
      addClass(el, "tex-list-item");
      el.contentEditable = "true";
      el.innerHTML = isEmptyString(content ?? "") ? "<br>" : content || "";
      el.id = this.getId() + "-li-" + generateRandomString(8);
    });
  }

  removeItem(index?: number | null): void {
    const realIndex = typeof index === "number" ? index : this.getItemIndex(),
      element = this.getItem(realIndex);

    element?.remove();
  }

  getListContainer(): HTMLElement | null {
    const container = document.getElementById(this.getId());

    return container;
  }

  count(container: HTMLElement | null = null): number {
    const listContainer = container ? container : this.getCurrentBlock();

    if (!listContainer) return 0;

    return queryLength(".tex-list-item", listContainer);
  }

  getItem(index: number, container: HTMLElement | null = null): HTMLElement | null {
    const realIndex = index === -1 ? this.getItemIndex() : index,
      listContainer = container ? container : this.getCurrentBlock() || this.getElement();

    if (!listContainer) return null;

    let item = null;

    query(
      ".tex-list-item",
      (el: HTMLElement, i: number) => {
        if (i === realIndex) item = el;
      },
      listContainer
    );

    return item;
  }

  getCurrentBlock() {
    return this.editor.blockManager.getCurrentBlock();
  }

  getListElementIndex(element: HTMLElement | EventTarget | null): number {
    let index = 0;
    const listContainer = this.getCurrentBlock();

    if (listContainer) {
      query(
        ".tex-list-item",
        (el: HTMLElement, i: number) => {
          if (element === el) index = i;
        },
        listContainer
      );
    }

    return index;
  }

  parse(item: OutputBlockItem) {
    const ul = make("ul", (el: HTMLElement) => {
      append(el, this.editor.parser.parseChilds(item));

      query(
        "li",
        (li: HTMLElement) => {
          li.outerHTML = this.createItem(li.innerHTML).outerHTML;
        },
        el
      );
    });

    return this.create({
      content: ul.innerHTML || "<br>"
    });
  }

  protected onLoad() {
    this.addEvents();

    setTimeout(() => {
      if (this.editor.blockManager.getCurrentBlock() === this.getCurrentBlock()) this.focusChild()?.focus();
    }, 1);
  }

  isTarget(evt: Event) {
    if (evt.target instanceof HTMLElement) {
      if (!hasClass(evt.target, "tex-block") && evt.target?.nodeName == "LI") {
        return true;
      }
    }

    return false;
  }

  setItemIndex(index: number): void {
    this.itemIndex = index;
  }

  getItemIndex(): number {
    const activeItem = this.getActiveListItem();
    if (!activeItem) return this.itemIndex;

    const items = this.getCurrentBlock()?.querySelectorAll(".tex-list-item") || [];
    return Array.from(items).indexOf(activeItem);
  }

  private addEvents() {
    const { blockManager, config, events, selectionApi } = this.editor,
      setItemIndex = (el: HTMLElement) => {
        this.setItemIndex(this.getListElementIndex(el));
      },
      defCallback = (evt: Event) => {
        if (evt.target instanceof HTMLElement && !hasClass(evt.target, "tex-block") && evt.target?.nodeName == "LI") {
          setItemIndex(evt.target);
        }
      };

    events.add("keydown.list", defCallback);
    events.add("click.list", defCallback);
    events.add("onSelectionChange.list", () => {
      const el = document.activeElement;

      if (el instanceof HTMLElement && el.nodeName === "LI") setItemIndex(el);
    });

    events.add("htmlToDataElementOutput.list", (item: OutputBlockItem) => {
      if (item && item.type == "li") delete item.attr;
    });

    events.add("keydownBackspaceKey.list", (evt: KeyboardEvent) => {
      if (this.isTarget(evt)) {
        const currentItem = this.getItem(-1);
        const [cursorStart, cursorEnd] = selectionApi.getOffset(currentItem);
        const currentItemIndex = this.getItemIndex();

        if (this.isEmpty()) {
          evt.preventDefault();
          this.removeItem();

          const prevIndex = currentItemIndex - 1;
          const prevElem = this.getItem(prevIndex, blockManager.getCurrentBlock()) || null;
          const prevTextLength = prevElem?.textContent?.length || 0;

          prevElem?.focus();
          selectionApi.select(prevTextLength, prevTextLength, prevElem as HTMLElement);
        } else {
          if (cursorStart === 0 && cursorEnd === 0) {
            evt.preventDefault();

            if (currentItemIndex > 0) {
              const prevItem = this.getItem(currentItemIndex - 1);
              const prevTextLength = prevItem?.textContent?.length || 0;

              this.mergeItems();

              if (prevItem) {
                setTimeout(() => {
                  selectionApi.select(prevTextLength, prevTextLength, prevItem);
                }, 10);
              }
            } else {
              this.mergeItems();
            }
          }
        }
      }
    });

    events.add("keydownEnterKey.list", (evt: KeyboardEvent) => {
      if (this.isTarget(evt)) {
        evt.preventDefault();

        const currentBlock = blockManager.getCurrentBlock(),
          currentItem = this.getItem(-1),
          defBlock = config.get("defaultBlock", "p"),
          curTextLength = currentItem?.textContent?.length || 0,
          [cursorStart, cursorEnd] = selectionApi.getOffset(currentItem),
          curIndex = this.getListElementIndex(currentItem),
          listLength = queryLength("li", currentBlock as HTMLElement);

        if (this.isEmpty() && listLength == curIndex + 1) {
          this.removeItem();
          blockManager.createBlock(defBlock);
        } else {
          if (cursorStart === cursorEnd && cursorStart === curTextLength) {
            this.insertItem(currentItem);
          } else {
            if (cursorStart === cursorEnd) {
              this.insertItem(currentItem, selectionApi.splitContent(currentItem));
            } else {
              this.insertItem(currentItem);
            }
          }
        }
      }
    });
  }

  focusChild(): HTMLElement | null {
    const curBlock = this.getCurrentBlock(),
      li = curBlock?.firstChild;

    if (!li || !(li instanceof HTMLElement) || li.localName !== "li") return null;

    return li;
  }

  isEmpty(): boolean {
    const currentItem = this.getItem(-1);

    if (!currentItem) return false;

    return (
      isEmptyString(currentItem?.innerHTML || "") ||
      currentItem?.innerHTML == "<br>" ||
      currentItem?.innerHTML == "<br>"
    );
  }

  insertItem(
    currentItem: HTMLElement | null,
    content: string = "<br>",
    focus: boolean = true,
    method: InsertPosition = "afterend"
  ) {
    const newItem = this.createItem(content);
    currentItem?.insertAdjacentElement(method, newItem);
    this.editor.events.refresh();

    if (focus) {
      document.getElementById(newItem.id)?.focus();
    }
  }

  merge(index: number): void {
    const BM = this.editor.blockManager;
    const curBlock = BM.getCurrentBlock();
    const container = BM.getByIndex(index);
    const count = this.count(container);
    const listIndex = count > 0 ? count - 1 : 0;
    const lastItem = this.getItem(listIndex, container);

    if (curBlock?.nodeName != "UL" && curBlock?.nodeName != "OL") {
      // P => UL|OL
      if (lastItem) {
        append(lastItem, document.createTextNode(" "));
        BM.merge(index - 1, index, lastItem);
      }
    } else {
      // UL|OL => UL|OL
      const item = this.getItem(0);
      const prevModel = BM.getModel(index - 1);

      if (item && prevModel instanceof List) {
        const prevContainer = BM.getByIndex(index - 1);
        const prevCount = prevModel.count(prevContainer);
        const prevLastItem = prevModel.getItem(prevCount > 0 ? prevCount - 1 : 0, prevContainer);

        if (prevLastItem) {
          this.mergeAndFocus(item, prevLastItem);
        }
      }
    }
  }

  private mergeItems() {
    const { blockManager, selectionApi } = this.editor;
    const curIndex = blockManager.getIndex();

    if (!curIndex) return;

    const prevModel = blockManager.getModel(curIndex - 1);
    const currentItem = this.getItem(-1);
    const [cursorStart, cursorEnd] = selectionApi.getOffset(currentItem);
    const isAtStartOfItem = cursorStart === 0 && cursorEnd === 0;
    const currentItemIndex = this.getItemIndex();

    if (!isAtStartOfItem) return;

    if (currentItemIndex > 0) {
      const prevItem = this.getItem(currentItemIndex - 1);
      if (prevItem && currentItem) {
        this.mergeAndFocus(currentItem, prevItem);
        return;
      }
    }

    if (prevModel?.getConfig("autoMerge") && prevModel?.isEditable()) {
      const firstLi = this.getItem(0);
      const prevElem = prevModel.getElement();

      if (prevElem && firstLi?.childNodes) {
        // LI => P
        if (firstLi === currentItem) {
          this.mergeAndFocus(firstLi, prevElem);
          const count = this.count();
          if (!count) blockManager.removeBlock();
        }
      }
    } else {
      prevModel?.merge(curIndex);
    }
  }

  private mergeAndFocus(curElement: HTMLBlockElement | HTMLElement, prevElement: HTMLBlockElement | HTMLElement) {
    const { selectionApi } = this.editor,
      prevTextContent = prevElement?.textContent,
      nodes = getChildNodes(curElement);

    if (prevTextContent) {
      const len = prevTextContent.length;
      nodes.unshift(document.createTextNode(" "));
      append(prevElement, nodes);
      curElement.remove();

      setTimeout(() => prevElement.focus(), 50);
      setTimeout(() => selectionApi.select(len + 1, len + 1, prevElement), 100);
    }
  }

  convert(block: HTMLBlockElement, newBlock: HTMLBlockElement): HTMLBlockElement {
    if (
      (block.localName == "ol" || block.localName == "ul") &&
      (newBlock.localName == "ol" || newBlock.localName == "ul")
    ) {
      newBlock.innerHTML = "";
      query(
        "li",
        (li: HTMLLIElement) => {
          append(newBlock, li);
        },
        block
      );

      return newBlock;
    }

    newBlock.innerHTML = "";
    const item = this.createItem("");
    append(item, getChildNodes(block));
    append(newBlock, item);

    return newBlock;
  }

  toConvert(block: HTMLBlockElement, newBlock: HTMLBlockElement): [HTMLBlockElement, HTMLBlockElement] {
    if (
      !(
        (block.localName == "ol" || block.localName == "ul") &&
        (newBlock.localName == "ol" || newBlock.localName == "ul")
      )
    ) {
      const tempBlock = make("div");
      query(
        "li",
        (li: HTMLLIElement) => {
          append(tempBlock, getChildNodes(li));
          appendText(tempBlock, " ");
        },
        block
      );

      block.innerHTML = "";
      append(block, getChildNodes(tempBlock));
    }

    return [block, newBlock];
  }
}
