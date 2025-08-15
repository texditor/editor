import Texditor from "@/texditor";
import { HTMLBlockElement } from "@/types/core";
import { closest, queryLength, query, append, make, addClass, removeClass } from "@/utils/dom";
import { isEmptyString } from "@/utils/string";
import BlockModel from "./models/block-model";
import { BlockModelInterface, BlockModelStructure } from "@/types/core/models";

export default class BlockManager {
  private editor: Texditor;
  private blockIndex: number = 0;

  constructor(editor: Texditor) {
    this.editor = editor;
  }

  render(): HTMLElement {
    const { api, config, parser } = this.editor;

    setTimeout(() => {
      const blocksElement = this.getContainer();

      query(
        "*",
        (el: HTMLElement, i: number) => {
          if (i === 0) this.focus(el);
        },
        blocksElement
      );
    }, 10);

    return make("div", (el: HTMLElement) => {
      addClass(el, api.css("blocks", false));
      const initalData = config.get("initalData", []),
        emptyData = [
          {
            type: config.get("defaultBlock", "p"),
            data: [""]
          }
        ];

      const blocks = parser.parseBlocks(initalData?.length ? initalData : emptyData);

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

  getCurrentBlock(): HTMLElement | null {
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

  detectEmpty() {
    const { api } = this.editor,
      root = api.getRoot();

    if (root) {
      query(
        api.css("block"),
        (el: HTMLBlockElement) => {
          if (el.blockModel?.isEmptyDetect()) {
            const index = this.getElementIndex(el);
            el.dataset["empty"] = this.isEmpty(index) ? "true" : "false";
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
    let blockElement = null;

    query(this.editor.api.css("block"), (el: HTMLElement) => {
      if (closest(target, el)) {
        blockElement = el;
      }
    });

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
    const blockElement = this.getByIndex(index);

    if (!blockElement) return null;

    blockElement.focus();

    return blockElement;
  }

  removeBlock(index: number | null = null): number | null {
    let blockElement = null;
    let currentIndex = null;

    if (index !== null) {
      blockElement = this.getByIndex(index);
    } else {
      blockElement = this.getCurrentBlock();
    }

    if (!blockElement) return null;

    currentIndex = this.getIndex();
    blockElement.remove();

    return currentIndex;
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
}
