import Texditor from "@/texditor";
import { HTMLBlockElement } from "@/types/core";
import {
  closest,
  queryLength,
  query,
  append,
  make,
  addClass,
  removeClass,
  hasClass,
  queryList,
  css
} from "@/utils/dom";
import { isEmptyString } from "@/utils/string";
import BlockModel from "./models/block-model";
import { BlockModelInterface, BlockModelStructure } from "@/types/core/models";
import { off, on } from "@/utils/events";
import { sanitizeJson } from "@/utils/sanitizerJson";

export default class BlockManager {
  private editor: Texditor;
  private blockIndex: number = 0;
  private isSelectionMode: boolean = false;

  constructor(editor: Texditor) {
    this.editor = editor;
  }

  render(renderData?: object[] | string): HTMLElement {
    const { api, config, parser } = this.editor;

    setTimeout(() => {
      const blocksElement = this.getContainer();

      query(
        "*",
        (el: HTMLElement, i: number) => {
          if (config.get("autofocus", true)) if (i === 0) this.focus(el);
        },
        blocksElement
      );
    }, 10);

    return make("div", (el: HTMLElement) => {
      addClass(el, api.css("blocks", false));
      let data = [];
      const initalData =
          (renderData && Array.isArray(renderData) && renderData.length) ||
          (typeof renderData === "string" && !isEmptyString(renderData))
            ? renderData
            : config.get("initalData", []),
        emptyData = [
          {
            type: config.get("defaultBlock", "p"),
            data: [""]
          }
        ];
      try {
        data =
          typeof initalData === "string"
            ? isEmptyString(initalData)
              ? []
              : JSON.parse(sanitizeJson(initalData.trim()) || "")
            : initalData;
      } catch (e) {
        console.warn("The input data is not supported or contains errors when working with JSON", e);
      }

      data = JSON.parse(sanitizeJson(data) || "");

      let blocks = parser.parseBlocks(data?.length ? data : emptyData);

      if (!blocks.length && data?.length) blocks = parser.parseBlocks(emptyData);

      if (blocks.length) append(el, blocks);
    });
  }

  getContainer(): HTMLElement | undefined {
    const { api } = this.editor,
      root = api.getRoot();

    if (!root) return;

    let container = null;

    query(api.css("blocks"), (el: HTMLElement) => (container = el), root);

    if (!container) return;

    return container;
  }

  getItems(): HTMLBlockElement[] {
    const blocks: HTMLBlockElement[] = [],
      blockContainer = this.getContainer();

    if (blockContainer) {
      query(this.editor.api.css("block"), (el: HTMLBlockElement) => blocks.push(el), blockContainer);
    }

    return blocks;
  }

  getByIndex(index: number): HTMLBlockElement | null {
    const blockContainer = this.getContainer();

    if (!blockContainer) return null;

    let block = null;

    query(
      this.editor.api.css("block"),
      (el: HTMLElement, i: number) => {
        if (i === index) block = el;
      },
      blockContainer
    );

    return block;
  }

  getNextBlock(): HTMLBlockElement | null {
    const currentIndex = this.getIndex();

    return this.getByIndex(currentIndex + 1);
  }

  getPrevBlock(): HTMLBlockElement | null {
    const currentIndex = this.getIndex();

    return this.getByIndex(currentIndex - 1);
  }

  isTextBlock(block: HTMLBlockElement | null): boolean {
    if (!block) return false;

    const model = block.blockModel;

    return model?.getConfig("editable") && !model?.getConfig("editableChilds");
  }

  createDefaultBlock(): HTMLElement | null {
    const defaultBlock = this.editor.config.get("defaultBlock", "p");

    return this.createBlock(defaultBlock);
  }

  getCurrentBlock(): HTMLBlockElement | null {
    return this.getByIndex(this.getIndex());
  }

  count(): number {
    return queryLength(this.editor.api.css("block"), this.getContainer());
  }

  isEmpty(index: number | null = null): boolean {
    const blockElement = index !== null ? this.getByIndex(index) : this.getCurrentBlock();

    if (!blockElement) return false;

    return isEmptyString(blockElement?.innerHTML || "") || blockElement?.innerHTML == "<br>";
  }

  detectEmpty(emptyAttr: boolean = true) {
    const { api } = this.editor,
      root = api.getRoot();

    if (root) {
      query(
        api.css("block"),
        (el: HTMLBlockElement) => {
          if (el.blockModel?.isEmptyDetect()) {
            const index = this.getElementIndex(el);
            el.dataset["empty"] = !emptyAttr ? "false" : this.isEmpty(index) ? "true" : "false";
          }
        },
        root
      );
    }
  }

  normalize() {
    const items = this.getItems(),
      { commands } = this.editor;

    items.forEach((item: HTMLBlockElement) => {
      const model = item.blockModel;

      if ((model?.isEditable() || model?.isEditableChilds()) && model?.isNormalize()) {
        const container = model.normalizeContainer();

        if (container) {
          if (Array.isArray(container)) {
            container.forEach((el: HTMLElement | HTMLBlockElement) => {
              commands.normalize(el as HTMLElement);
            });
          } else {
            commands.normalize(container as HTMLElement);
          }
        }
      }
    });
  }

  setIndex(index: number) {
    const { api } = this.editor,
      cssName = api.css("block", false),
      root = api.getRoot(),
      block = this.getByIndex(index);

    this.blockIndex = index;

    if (root && block) {
      query("." + cssName, (block: HTMLElement) => removeClass(block, cssName + "-active"), root);

      addClass(block, cssName + "-active");
    }
  }

  getIndex(): number {
    return this.blockIndex;
  }

  getModel(index: number | null = null): BlockModel | null {
    const outIndex = index === null ? this.getIndex() : index,
      block = this.getByIndex(outIndex);

    if (!block) return null;

    return block.blockModel;
  }

  getTargetBlock(target: EventTarget): HTMLElement | null {
    const { api } = this.editor,
      root = api.getRoot();

    if (!root) return null;

    let blockElement = null;

    query(
      api.css("block"),
      (el: HTMLElement) => {
        if (closest(target, el)) blockElement = el;
      },
      root
    );

    return blockElement;
  }

  getElementIndex(element: HTMLElement | EventTarget | null, findTargetBlock: boolean = false): number {
    let index = 0;

    const realElement = findTargetBlock && element instanceof EventTarget ? this.getTargetBlock(element) : element;

    query(
      this.editor.api.css("block"),
      (el: HTMLElement, i: number) => {
        if (realElement === el) index = i;
      },
      this.getContainer()
    );

    return index;
  }

  focus(el?: HTMLElement) {
    const element = el ? el : this.getContainer();

    if (element) element.focus();
  }

  focusByIndex(index: number): HTMLElement | null {
    const blockElement = this.getByIndex(index),
      model = this.getModel(index);

    if (!blockElement) return null;
    if (model?.isEditable() && !model.isEditableChilds()) {
      blockElement.focus();
    } else if (model?.isEditableChilds()) {
      const firstItem = model.getItem(0) as HTMLElement;
      if (firstItem) firstItem?.focus();
    } else {
      blockElement.click();
    }

    return blockElement;
  }

  removeBlock(index: number | number[] | null = null): number | null {
    const { config, selectionApi } = this.editor;

    let lastRemovedIndex: number | null = null;
    let lastRemovedBlock: HTMLElement | null = null;

    if (Array.isArray(index)) {
      if (index.length === 0) return null;

      const sortedIndices = [...index].sort((a, b) => b - a);

      for (const currentIndex of sortedIndices) {
        const blockElement = this.getByIndex(currentIndex);
        if (blockElement) {
          lastRemovedIndex = currentIndex;
          lastRemovedBlock = blockElement;
          blockElement.remove();
        }
      }
    } else {
      let blockElement: HTMLElement | null = null;
      let currentIndex: number | null = null;

      if (index !== null) {
        blockElement = this.getByIndex(index);
        currentIndex = index;
      } else {
        blockElement = this.getCurrentBlock();
        currentIndex = this.getIndex();
      }

      if (!blockElement || currentIndex === null) return null;

      lastRemovedIndex = currentIndex;
      lastRemovedBlock = blockElement;
      blockElement.remove();
    }

    if (lastRemovedBlock && lastRemovedIndex !== null) {
      if (lastRemovedIndex <= 0) {
        setTimeout(() => this.focusByIndex(0), 100);
      } else {
        const prevIndex = lastRemovedIndex - 1;
        const prevElem = this.getByIndex(prevIndex);

        if (prevElem) {
          const prevTextLength = prevElem?.textContent?.length || 0;
          prevElem.focus();
          selectionApi.select(prevTextLength, prevTextLength, prevElem);
        }
      }
    }

    const defBlock = config.get("defaultBlock", "p");
    if (this.count() == 0) {
      this.createBlock(defBlock, -1);
    }

    this.editor.events.change({
      type: "removeBlock",
      index: index,
      element: lastRemovedBlock
    });

    return lastRemovedIndex;
  }

  createBlock(name: string, index: number | null = null, content?: object): HTMLElement | null {
    const { api, events } = this.editor,
      blockModels = api.getModels(),
      element = null;

    (blockModels as BlockModelStructure[]).forEach((formatedModel: BlockModelStructure) => {
      if (formatedModel.types && formatedModel.types.includes(name)) {
        const blockInstance: BlockModelInterface = new formatedModel.instance(this.editor);

        if (blockInstance) {
          if (index !== null && index === -1) {
            const blockContainer = this.getContainer();

            if (blockContainer) {
              const block = blockInstance.create(content);

              if (block) {
                append(blockContainer, block);
              }
            }
          } else {
            const curIndex = index !== null ? index : this.getIndex(),
              curBlock = this.getByIndex(curIndex),
              block = blockInstance.create(content);

            if (block) {
              curBlock?.insertAdjacentElement("afterend", block);
            }
          }

          const newBlock = blockInstance.getElement();

          if (newBlock) {
            this.focus(newBlock);
          }

          if (blockInstance.afterCreate) blockInstance.afterCreate(newBlock as HTMLBlockElement);

          events.refresh();

          return newBlock;
        }
      }
    });
    return element;
  }

  merge(index: number, currentIndex?: number | null, children?: HTMLElement | null) {
    const finalBlock = this.getByIndex(index),
      currentBlock = currentIndex ? this.getByIndex(currentIndex) : this.getCurrentBlock();

    if (currentBlock && finalBlock) {
      const element = children ? children : finalBlock;
      element.innerHTML += currentBlock.innerHTML;
      this.removeBlock(currentIndex || null);
    }
  }

  public enableSelectionMode(): void {
    const { actions, api, events, toolbar } = this.editor,
      container = this.getContainer(),
      uniqueId = api.getUniqueId(),
      root = api.getRoot();

    if (this.isSelectionMode || !root) return;

    this.isSelectionMode = true;

    toolbar.hide();
    actions.hideMenu();
    const actionsOpen = api.css("actionsOpen");
    query(actionsOpen, (el: HTMLElement) => css(el, "display", "none"), root);

    this.getItems().forEach((block: Element) => {
      on(block, "click.bc", (evt: MouseEvent) => {
        if (!this.isSelectionMode) return;

        evt.preventDefault();
        evt.stopPropagation();

        const index = this.getElementIndex(evt.currentTarget as HTMLBlockElement);
        this.toggleBlockSelection(index);
      });
    });
    off(document, "click.bmDoc" + uniqueId);
    on(document, "click.bmDoc" + uniqueId, (evt) => {
      if (container && !closest(evt.target, container)) this.clearSelection();
    });

    this.disableAllBlocks();
    events.trigger("selectionModeEnabled");
  }

  public disableSelectionMode(): void {
    const { api, events } = this.editor,
      uniqueId = api.getUniqueId(),
      root = api.getRoot();

    if (!this.isSelectionMode || !root) return;

    const actionsOpen = api.css("actionsOpen");
    query(actionsOpen, (el: HTMLElement) => css(el, "display", ""), root);
    this.isSelectionMode = false;
    this.getItems().forEach((block: Element) => off(block, "click.bc"));
    off(document, "click.bmDoc" + uniqueId);
    this.clearSelection();
    this.enableAllBlocks();
    events.trigger("selectionModeDisabled");
  }

  public isSelectionModeActive(): boolean {
    return this.isSelectionMode;
  }

  private toggleBlockSelection(index: number): void {
    const { api, events } = this.editor;
    const block = this.getByIndex(index);

    if (block) {
      if (hasClass(block, api.css("block", false) + "-selected")) this.removeBlockSelection(index);
      else this.addBlockSelection(index);

      events.trigger("selectionChanged", this.getSelectedBlocks());
    }
  }

  private addBlockSelection(index: number): void {
    const { api } = this.editor;
    const block = this.getByIndex(index),
      cssName = api.css("block", false) + "-selected";

    if (block && !hasClass(block, cssName)) addClass(block, cssName);
  }

  private removeBlockSelection(index: number): void {
    const { api } = this.editor;
    const block = this.getByIndex(index);

    if (block) removeClass(block, api.css("block", false) + "-selected");
  }

  public getSelectedBlocks(): HTMLElement[] {
    const { api } = this.editor,
      cssName = api.css("block") + "-selected";

    return queryList(cssName);
  }

  public hasSelectedBlocks(): boolean {
    return this.getSelectedBlocks().length > 0;
  }

  public clearSelection(): void {
    const { api, events } = this.editor;
    this.getItems().forEach((block: HTMLBlockElement) => {
      removeClass(block, api.css("block", false) + "-selected");
    });
    events.trigger("selectionChanged", []);
  }

  public deleteSelectedBlocks(): void {
    const blocks = this.getSelectedBlocks();
    if (blocks.length === 0) return;
    const indexes: number[] = [];
    blocks.forEach((element: HTMLElement) => indexes.push(this.getElementIndex(element)));
    this.removeBlock(indexes);
    this.clearSelection();
    this.disableSelectionMode();
  }

  public disableAllBlocks(): void {
    const { api } = this.editor;
    const blocks = this.getItems();
    const cssName = api.css("block", false);

    blocks.forEach((block: HTMLBlockElement) => {
      if (block.blockModel?.isEditable()) {
        block.removeAttribute("contenteditable");
        if (isEmptyString(block.innerHTML)) block.innerHTML = "\u200B";
      }

      addClass(block, cssName + "-non-editable");
    });
  }

  public enableAllBlocks(): void {
    const { api } = this.editor,
      blocks = this.getItems(),
      cssName = api.css("block", false);

    blocks.forEach((block: HTMLBlockElement) => {
      const wasEditable = block.blockModel?.isEditable();

      if (wasEditable) block.setAttribute("contenteditable", "true");
      else block.removeAttribute("contenteditable");

      removeClass(block, cssName + "-non-editable");
    });
  }

  public convert(block: HTMLBlockElement, model: BlockModelInterface) {
    const { events } = this.editor;

    if (block) {
      let newBlock = model.create() as HTMLBlockElement;
      const curIndex = this.getElementIndex(block);

      if (newBlock) {
        const [cBlock, cNewBlock] = block.blockModel.toConvert(block, newBlock);

        newBlock = cNewBlock.blockModel.convert(cBlock, cNewBlock);

        block?.insertAdjacentElement("afterend", newBlock);

        if (Object.keys(model.getConfig("sanitizerConfig", {})).length) newBlock.blockModel.sanitize();

        block.remove();
        this.focusByIndex(curIndex);
        events.change({
          type: "convertBlock",
          index: curIndex,
          block: newBlock
        });
        events.refresh();
      }
    }
  }

  destroy() {
    const { api } = this.editor,
      uniqueId = api.getUniqueId();

    off(document, "click.bmDoc" + uniqueId);
  }
}
