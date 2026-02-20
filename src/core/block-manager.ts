import type {
  BlockManagerInterface,
  HTMLBlockElement,
  TexditorInterface,
  BlockModelInstanceInterface,
  BlockModelInterface,
  BlockModelStructure
} from "@/types";
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
import { off, on } from "@/utils/events";
import { sanitizeJson } from "@/utils/sanitizer";
import { Paragraph } from "@/blocks";

export default class BlockManager implements BlockManagerInterface {
  private editor: TexditorInterface;
  private blockIndex: number = 0;
  private isSelectionMode: boolean = false;
  private blockModels: BlockModelStructure[] = [];

  constructor(editor: TexditorInterface) {
    this.editor = editor;
  }

  render(renderData?: object[] | string): HTMLElement {
    const { config, parser } = this.editor;

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
      addClass(el, 'tex-blocks');
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
        console.warn(
          "The input data is not supported or contains errors when working with JSON",
          e
        );
      }

      data = JSON.parse(sanitizeJson(data) || "");

      let blocks = parser.parseBlocks(data?.length ? data : emptyData);

      if (!blocks.length && data?.length)
        blocks = parser.parseBlocks(emptyData);

      if (blocks.length) append(el, blocks);
    });
  }

  getContainer(): HTMLElement | undefined {
    const root = this.editor.api.getRoot();

    if (!root) return;

    let container = null;

    query('.tex-blocks', (el: HTMLElement) => (container = el), root);

    if (!container) return;

    return container;
  }

  getItems(): HTMLBlockElement[] {
    const blockElements: HTMLBlockElement[] = [],
      blockContainer = this.getContainer();

    if (blockContainer) {
      query(
        '.tex-block',
        (el: HTMLBlockElement) => blockElements.push(el),
        blockContainer
      );
    }

    return blockElements;
  }

  getByIndex(index: number): HTMLBlockElement | null {
    const blockContainer = this.getContainer();

    if (!blockContainer) return null;

    let block = null;

    query(
      '.tex-block',
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

  isTextBlock(blockElement: HTMLBlockElement | null): boolean {
    if (!blockElement) return false;

    const model = blockElement.blockModel;

    return model?.getConfig("editable") && !model?.getConfig("editableChilds");
  }

  createDefaultBlock(): HTMLElement | null {
    const defaultBlock = this.editor.config.get("defaultBlock", "p");

    return this.createBlock(defaultBlock);
  }

  getCurrentBlock(): HTMLBlockElement | null {
    return this.getByIndex(this.getIndex());
  }

  getBlockContentElement(blockElement?: HTMLBlockElement | HTMLElement): HTMLElement | null {
    const realBlockEl = blockElement || this.getCurrentBlock();

    if (!realBlockEl)
      return null;

    let elem = null;
    query('.tex-block-content', (el: HTMLElement) => elem = el, realBlockEl);

    return elem;
  }

  count(): number {
    return queryLength('.tex-block', this.getContainer());
  }

  isEmpty(index: number | null = null): boolean {
    const blockElement =
      index !== null
        ? this.getByIndex(index)
        : this.getCurrentBlock();

    if (!blockElement) return false;

    const blockContent = this.getBlockContentElement(blockElement);

    return (
      isEmptyString(blockContent?.innerHTML || "") ||
      blockContent?.innerHTML == "<br>"
    );
  }

  detectEmpty(emptyAttr: boolean = true) {
    const { api } = this.editor,
      root = api.getRoot();

    if (root) {
      query(
        '.tex-block',
        (blockElement: HTMLBlockElement) => {
          if (blockElement.blockModel?.isEmptyDetect()) {
            const index = this.getElementIndex(blockElement);
            const blockContent = this.getBlockContentElement(blockElement);

            if (blockContent) {
              blockContent.dataset["empty"] = !emptyAttr
                ? "false"
                : this.isEmpty(index)
                  ? "true"
                  : "false";
            }
          }
        },
        root
      );
    }
  }

  normalize() {
    const items = this.getItems(),
      { commands } = this.editor;

    items.forEach((blockElement: HTMLBlockElement) => {
      const model = blockElement.blockModel;

      if (
        (model?.isEditable() || model?.isEditableChilds()) &&
        model?.isNormalize()
      ) {
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
      cssName = 'tex-block',
      root = api.getRoot(),
      block = this.getByIndex(index);

    this.blockIndex = index;

    if (root && block) {
      query(
        "." + cssName,
        (blockElement: HTMLBlockElement) => removeClass(blockElement, cssName + "-active"),
        root
      );

      addClass(block, cssName + "-active");
    }
  }

  getIndex(): number {
    return this.blockIndex;
  }

  getModel(index: number | null = null): BlockModelInterface | null {
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
      '.tex-block',
      (el: HTMLElement) => {
        if (closest(target, el)) blockElement = el;
      },
      root
    );

    return blockElement;
  }

  getElementIndex(
    element: HTMLElement | EventTarget | null,
    findTargetBlock: boolean = false
  ): number {
    let index = 0;

    const realElement =
      findTargetBlock && element instanceof EventTarget
        ? this.getTargetBlock(element)
        : element;

    query(
      '.tex-block',
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
      index: index as number,
      element: lastRemovedBlock
    });

    return lastRemovedIndex;
  }

  createBlock(
    name: string,
    index: number | null = null,
    content?: object
  ): HTMLElement | null {
    const { blockManager, events } = this.editor,
      blockModels = blockManager.getBlockModels(),
      element = null;

    (blockModels).forEach(
      (formatedModel: BlockModelStructure) => {
        if (formatedModel.types && formatedModel.types.includes(name)) {
          const blockInstance: BlockModelInterface = new formatedModel.instance(
            this.editor
          );

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

            const newBlockEl = blockInstance.getElement(),
              blockContent = blockInstance.getBlockContentElement();

            if (blockContent) {
              this.focus(blockContent);
            }

            if (blockInstance.afterCreate)
              blockInstance.afterCreate(newBlockEl as HTMLBlockElement);

            events.refresh();

            return newBlockEl;
          }
        }
      }
    );
    return element;
  }

  merge(
    index: number,
    currentIndex?: number | null,
    children?: HTMLElement | null
  ) {
    const finalBlock = this.getByIndex(index),
      currentBlock = currentIndex
        ? this.getByIndex(currentIndex)
        : this.getCurrentBlock();

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

    query(
      '.tex-actions-open',
      (el: HTMLElement) => css(el, "display", "none"),
      root
    );

    this.getItems().forEach((block: Element) => {
      on(block, "click.bc", (evt: MouseEvent) => {
        if (!this.isSelectionMode) return;

        evt.preventDefault();
        evt.stopPropagation();

        const index = this.getElementIndex(
          evt.currentTarget as HTMLBlockElement
        );
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

    query(
      '.tex-actions-open',
      (el: HTMLElement) => css(el, "display", ""),
      root
    );

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
    const { events } = this.editor;
    const block = this.getByIndex(index);

    if (block) {
      if (hasClass(block, "tex-block-selected"))
        this.removeBlockSelection(index);
      else this.addBlockSelection(index);

      events.trigger("selectionChanged", {
        selectedBlockElements: this.getSelectedBlocks()
      });
    }
  }

  private addBlockSelection(index: number): void {
    const block = this.getByIndex(index),
      cssName = "tex-block-selected";

    if (block && !hasClass(block, cssName)) addClass(block, cssName);
  }

  private removeBlockSelection(index: number): void {
    const block = this.getByIndex(index);

    if (block) removeClass(block, "tex-block-selected");
  }

  public getSelectedBlocks(): HTMLElement[] {
    return queryList(".tex-block-selected");
  }

  public hasSelectedBlocks(): boolean {
    return this.getSelectedBlocks().length > 0;
  }

  public clearSelection(): void {
    const { events } = this.editor;

    this.getItems().forEach((blockElement: HTMLBlockElement) => {
      removeClass(blockElement, "tex-block-selected");
    });

    events.trigger("selectionChanged", { selectedBlockElements: [] });
  }

  public deleteSelectedBlocks(): void {
    const blocks = this.getSelectedBlocks();
    if (blocks.length === 0) return;
    const indexes: number[] = [];
    blocks.forEach((element: HTMLElement) =>
      indexes.push(this.getElementIndex(element))
    );
    this.removeBlock(indexes);
    this.clearSelection();
    this.disableSelectionMode();
  }

  public disableAllBlocks(): void {
    const blocks = this.getItems();
    const cssName = 'tex-block';

    blocks.forEach((blockElement: HTMLBlockElement) => {
      if (blockElement.blockModel?.isEditable()) {
        blockElement.removeAttribute("contenteditable");
        if (isEmptyString(blockElement.innerHTML)) blockElement.innerHTML = "\u200B";
      }

      addClass(blockElement, cssName + "-non-editable");
    });
  }

  public enableAllBlocks(): void {
    const blocks = this.getItems();

    blocks.forEach((blockElement: HTMLBlockElement) => {
      const wasEditable = blockElement.blockModel?.isEditable();

      if (wasEditable) blockElement.setAttribute("contenteditable", "true");
      else blockElement.removeAttribute("contenteditable");

      removeClass(blockElement, "tex-block-non-editable");
    });
  }

  public convert(blockElement: HTMLBlockElement, model: BlockModelInterface) {
    const { events } = this.editor;

    if (blockElement) {
      let newBlockEl = model.create() as HTMLBlockElement;
      const curIndex = this.getElementIndex(blockElement);

      if (newBlockEl) {
        const [cBlock, cNewBlock] = blockElement.blockModel.toConvert(blockElement, newBlockEl);

        newBlockEl = cNewBlock.blockModel.convert(cBlock, cNewBlock);

        blockElement?.insertAdjacentElement("afterend", newBlockEl);

        if (Object.keys(model.getConfig("sanitizerConfig", {})).length)
          newBlockEl.blockModel.sanitize();

        blockElement.remove();
        this.focusByIndex(curIndex);
        events.change({
          type: "convertBlock",
          index: curIndex,
          blockElement: newBlockEl
        });
        events.refresh();
      }
    }
  }

  getBlockModels(): BlockModelStructure[] {
    if (this.blockModels.length > 0) return this.blockModels;

    const blockModels = this.editor.config.get("blockModels", []);

    if (!blockModels) return [];

    if (blockModels.length == 0) {
      blockModels.push(Paragraph);
    }

    (blockModels).forEach(
      (model: BlockModelInstanceInterface) => {
        const md = new model(this.editor);

        this.blockModels.push({
          instance: model,
          model: md,
          type: md.getType(),
          types: [md.getType(), ...md.getRelatedTypes()],
          translation: md.getTranslation(),
          icon: md.getIcon()
        });
      }
    );

    return this.blockModels;
  }

  getRealType(relatedName: string) {
    let type = null;

    (
      this.editor.blockManager.getBlockModels()
    ).forEach((model: BlockModelStructure) => {
      if (model.types && model.types.includes(relatedName)) {
        type = model.type;
      }
    });

    return type;
  }

  destroy() {
    const { api } = this.editor,
      uniqueId = api.getUniqueId();

    off(document, "click.bmDoc" + uniqueId);
  }
}
