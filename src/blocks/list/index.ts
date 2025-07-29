import { BlockModelInterface } from "@/types/core/models";
import BlockModel from "@/core/models/block-model";
import { queryLength, hasClass, make, query, queryList, append, addClass } from "@/utils/dom";
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
      shortType: "ul",
      icon: IconList,
      editable: false,
      editableChilds: true,
      toolbar: true,
      sanitizer: true,
      normalize: true,
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

  protected sanitizerContainer(): HTMLBlockElement | HTMLElement | HTMLElement[] | null {
    const block = this.getElement();

    if (!block) return null;

    return queryList("li", block);
  }

  normalizeContainer(): HTMLBlockElement | HTMLElement | HTMLElement[] | null {
    return this.sanitizerContainer();
  }

  editableChild(container: HTMLElement | null): HTMLElement | null {
    return this.getItem(-1, container);
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
    const realIndex = typeof index === "number" ? index : this.getIndex(),
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
    const realIndex = index === -1 ? this.getIndex() : index,
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

  private setIndex(index: number) {
    this.itemIndex = index;
  }

  private getIndex(): number {
    return this.itemIndex;
  }

  private addEvents() {
    const { blockManager, config, events, selectionApi } = this.editor,
      setIndex = (el: HTMLElement) => {
        this.setIndex(this.getListElementIndex(el));
      },
      defCallback = (evt: Event) => {
        if (evt.target instanceof HTMLElement && !hasClass(evt.target, "tex-block") && evt.target?.nodeName == "LI") {
          setIndex(evt.target);
        }
      };

    events.add("keydown.list", defCallback);
    events.add("click.list", defCallback);
    events.add("onSelectionChange.list", () => {
      const el = document.activeElement;

      if (el instanceof HTMLElement && el.nodeName === "LI") setIndex(el);
    });

    events.add("htmlToDataElementOutput.list", (item: OutputBlockItem) => {
      if (item && item.type == "li") delete item.attr;
    });

    events.add("keydownBackspaceKey.list", (evt: KeyboardEvent) => {
      if (this.isTarget(evt)) {
        const [cursorStart, cursorEnd] = selectionApi.getOffset(this.getItem(-1));

        console.log(this.getItem(-1));
        if (this.isEmpty()) {
          evt.preventDefault();
          this.removeItem();

          const prevIndex = this.getIndex() - 1,
            prevElem = this.getItem(prevIndex, blockManager.getCurrentBlock()) || null,
            prevTextLength = prevElem?.textContent?.length || 0;

          prevElem?.focus();
          selectionApi.select(prevTextLength, prevTextLength, prevElem as HTMLElement);
        } else {
          // Merge if not an empty item
          if (cursorStart === 0 && cursorEnd === 0) {
            evt.preventDefault();

            const index = this.getIndex(),
              finalItem = this.getItem(index - 1, blockManager.getCurrentBlock()),
              prevTextLength = finalItem?.textContent?.length || 0;

            this.mergeItems(index - 1);

            if (finalItem) {
              setTimeout(() => {
                selectionApi.select(prevTextLength, prevTextLength, finalItem);
              }, 10);
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

    return isEmptyString(currentItem?.innerHTML || "") || currentItem?.innerHTML == "<br>";
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
    const BM = this.editor.blockManager,
      container = BM.getByIndex(index - 1),
      count = this.count(container),
      listIndex = count > 0 ? count - 1 : 0,
      lastItem = this.getItem(listIndex, container);

    BM.merge(index - 1, index, lastItem);
  }

  mergeItems(index: number, currentIndex?: number) {
    const BM = this.editor.blockManager,
      blockIndex = BM.getIndex(),
      prevModel = BM.getModel(blockIndex - 1),
      finalBlock = this.getItem(index, BM.getCurrentBlock()),
      currentBlock = currentIndex ? this.getItem(currentIndex, BM.getCurrentBlock()) : this.getItem(-1);

    if (index < 0 && prevModel?.getTagName() !== "ul" && prevModel?.getTagName() !== "ol" && prevModel?.isEditable()) {
      let html = "";
      const curList = this.getElement(),
        prevBlock = BM.getByIndex(blockIndex - 1),
        prevModel = BM?.getModel(blockIndex - 1);

      if (prevModel?.getConfig("autoMerge")) {
        if (curList) {
          query(
            "li",
            (el: HTMLElement) => {
              html += " " + el.innerText;
            },
            curList
          );

          curList.remove();

          if (prevBlock) prevBlock.innerHTML += html || "";
        }
      }
    } else {
      if (currentBlock) {
        if (finalBlock) {
          finalBlock.innerHTML += currentBlock.innerHTML;
          this.removeItem(currentIndex || null);
        }
      }
    }
  }
}
