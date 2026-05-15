import type {
  BlockManager as IBlockManager,
  BlockElement,
  Texditor,
  BlockModelConstructor,
  BlockModel,
  BlockModelSchema,
  BlockCreateSchema,
  BlockSchema,
  BlockSchemaData,
  BlockCreateItemSchema,
  BlockChildSchema
} from "@/types";
import {
  closest,
  queryLength,
  query,
  append,
  addClass,
  removeClass,
  queryList,
  getChildNodes,
  appendText,
  getLength,
  getText,
  html,
  after,
  make,
  prepend,
  before,
  parseHtml,
  attr,
  toHtml,
  data
} from "@/utils/dom";
import { off, rebind } from "@/utils/events";
import { Paragraph } from "@/entities/blocks";
import VirtualSelection from "./ui/virtual-selection";
import { VirtualSelection as IVirtualSelection } from "@/types/core/ui/virtual-selection";
import { globalStore } from "@/store/globalStore";
import {
  decodeHtmlSpecialChars,
  executeMethodIfExists,
  generateRandomString
} from "@/utils";

export default class BlockManager implements IBlockManager {
  /** Reference to the main editor instance */
  private editor: Texditor;

  /** Current active block index */
  private blockIndex: number = 0;

  /** Cached block model configurations */
  private blockSchemas: BlockModelSchema[] = [];

  /** VirtualSelection */
  private virtualSelection: IVirtualSelection | null = null;

  /** Unique identifier for event listeners to prevent conflicts */
  private eventId: string = generateRandomString(16);

  constructor(editor: Texditor) {
    this.editor = editor;
  }

  /** @see IBlockManager.refreshVirtualSelection */
  refreshVirtualSelection(): IVirtualSelection | null {
    this.destroyVirtualSelection();

    const { config, events, tools } = this.editor
    const blocksContainer = this.getBlocksContainer();

    if (blocksContainer) {
      const selectionZone = config.get(
        'selectionZoneElement',
        this.editor.getRoot() || document.body
      );

      this.virtualSelection = new VirtualSelection({
        blocksContainer: blocksContainer,
        blockSelector: '.tex-block',
        selectionZone: selectionZone,
        exitTolerance: 16,
        touchActivationDelay: 250,
        selectedBlockClass: 'tex-ui-vs-selected',
        onLassoStart: () => {
          tools.hide();
        },
        onSelectionChange: (indices) => {
          events.change({
            type: 'virtualSelectionChange',
            index: indices
          });
        }
      });
    }

    return this.virtualSelection;
  }

  /** @see IBlockManager.getVirtualSelection */
  getVirtualSelection(): IVirtualSelection | null {
    return this.virtualSelection || this.refreshVirtualSelection();
  }

  /** @see IBlockManager.clearVirtualSelection */
  clearVirtualSelection(): void {
    const virtualSelection = this.getVirtualSelection();

    if (virtualSelection) 
      virtualSelection.clearSelection();
  }

  /** @see IBlockManager.destroyVirtualSelection */
  destroyVirtualSelection(): void {
    if (this.virtualSelection) {
      this.virtualSelection.destroy();
      this.virtualSelection = null;
    }
  }

  /** @see IBlockManager.getBlocksContainer */
  getBlocksContainer(): HTMLElement | null {
    const root = this.editor.getRoot();

    if (!root)
      return null;

    const [container] = queryList('.tex-blocks', root);

    return container || null;
  }

  /** @see IBlockManager.focus */
  focus(
    index: number,
    startPos?: number,
    endPos?: number,
    itemIndex?: number
  ): BlockElement | null {
    const blockElement = this.getElement(index),
      model = blockElement?.baseModel,
      { selectionApi } = this.editor;

    if (!model)
      return null;

    if (!blockElement)
      return null;

    const contentElement = this.getContentElement(blockElement);
    const selectEnd = (el: HTMLElement) => {
      const length = getLength(el) || 0

      if (length) {
        const start = startPos || length || 0,
          end = endPos || startPos || length || 0;

        blockElement.click();
        el.focus();

        selectionApi.select(start, end, el);
      } else {
        el.focus();
      }
    };

    if (contentElement) {
      contentElement.click();

      if (model?.isEditable() && !model.isEditableItems()) {
        selectEnd(contentElement);
      } else if (model?.isEditableItems()) {
        const item = typeof itemIndex === 'number'
          ? model.getItemBody(itemIndex)
          : (model.getItem(-1) as HTMLElement | null || model.getItemBody(0));

        if (item)
          selectEnd(item);
      } else {
        contentElement.click();

        if (
          !model?.isEditableItems() &&
          model.getItemsLength() > 0 &&
          typeof itemIndex === 'number'
        ) {
          model.getItemBody(itemIndex)?.click();
        }
      }
    }

    return blockElement;
  }

  /** @see IBlockManager.getBlocks */
  getBlocks(): BlockElement[] {
    const elements: BlockElement[] = [],
      blockContainer = this.getBlocksContainer();

    if (blockContainer) {
      query(
        '.tex-block',
        (el: BlockElement) => elements.push(el),
        blockContainer
      );
    }

    return elements;
  }

  /** @see IBlockManager.getElement */
  getElement(index?: number): BlockElement | null {
    const realIndex = index !== undefined
      ? index
      : this.getIndex(),
      blockContainer = this.getBlocksContainer();

    if (!blockContainer) return null;

    let block = null;

    query(
      '.tex-block',
      (el: HTMLElement, i: number) => {
        if (i === realIndex) block = el;
      },
      blockContainer
    );

    return block;
  }

  /** @see IBlockManager.getContentElement */
  getContentElement(
    blockElement?: BlockElement
  ): HTMLElement | null {
    const realBlockElement = blockElement || this.getElement();

    if (!realBlockElement)
      return null;

    const [content] = queryList('.tex-block-content', realBlockElement);

    return content || null;
  }

  /** @see IBlockManager.getNextBlockElement */
  getNextBlockElement(): BlockElement | null {
    const currentIndex = this.getIndex();

    return this.getElement(currentIndex + 1);
  }

  /** @see IBlockManager.getPrevBlockElement */
  getPrevBlockElement(): BlockElement | null {
    const currentIndex = this.getIndex();

    return this.getElement(currentIndex - 1);
  }

  /** @see IBlockManager.findParent */
  findParent(
    targetElement: EventTarget | BlockElement | HTMLElement
  ): BlockElement | null {
    let element = null;
    const container = this.getBlocksContainer();

    if (container) {
      query(
        '.tex-block',
        (el: HTMLElement) => {
          if (closest(targetElement, el)) element = el;
        },
        container
      );
    }

    return element;
  }

  /** @see IBlockManager.use */
  use(index: number): void {
    const { tools } = this.editor,
      cssName = 'tex-block',
      root = this.editor.getRoot(),
      blockElement = this.getElement(index);

    this.blockIndex = index;
    this.clearVirtualSelection();

    if (root && blockElement) {
      globalStore.set('el', root);
      globalStore.set('index', index);

      query(
        "." + cssName,
        (block: BlockElement) => {
          removeClass(block, cssName + "-active");
        },
        root
      );

      addClass(blockElement, cssName + "-active");

      rebind(document, 'click.notActive' + this.eventId, (evt: Event) => {
        if (!closest(evt.target, root)) {
          removeClass(blockElement, cssName + "-active");
          tools.hide();
        }
      });
    }
  }

  /** @see IBlockManager.getIndex */
  getIndex(
    el?: BlockElement | HTMLElement | EventTarget,
  ): number {
    if (!el)
      return this.blockIndex;

    let index = 0;

    const container = this.getBlocksContainer();

    if (container) {
      query(
        '.tex-block',
        (blockEl: HTMLElement, i: number) => {
          if (el === blockEl) index = i;
        },
        container
      );
    }

    return index;
  }

  /** @see IBlockManager.count */
  count(): number {
    const blocksContainer = this.getBlocksContainer();

    if (!blocksContainer)
      return 0;

    return queryLength('.tex-block', blocksContainer);
  }

  /** @see IBlockManager.isEmpty */
  isEmpty(index?: number): boolean {
    const model = this.getModel(index);

    if (!model)
      return true;

    return model.isEmpty();
  }

  /** @see IBlockManager.detectEmpty */
  detectEmpty(emptyAttr: boolean = true): void {
    const container = this.getBlocksContainer();

    if (container) {
      query(
        '.tex-block',
        (blockElement: BlockElement) => {
          if (blockElement.baseModel?.isEmptyDetect()) {
            const index = this.getIndex(blockElement);
            const contentElement = this.getContentElement(blockElement);

            if (contentElement) {
              data(
                contentElement,
                'empty',
                (!emptyAttr
                  ? "false"
                  : this.isEmpty(index)
                    ? "true"
                    : "false"
                )
              )
            }
          }
        },
        container
      );
    }
  }

  /** @see IBlockManager.normalize */
  normalize(): void {
    const items = this.getBlocks(),
      { commands } = this.editor;

    items.forEach((blockElement: BlockElement) => {
      const model = blockElement.baseModel;

      if (
        model &&
        (model.isEditable() || model.isEditableItems()) &&
        model.isNormalize()
      ) {
        const container = model.toNormalize();

        if (container) {
          if (Array.isArray(container)) {
            container.forEach((el: HTMLElement | BlockElement) => {
              commands.normalize(el as HTMLElement);
            });
          } else {
            commands.normalize(container as HTMLElement);
          }
        }
      }
    });
  }

  /** @see IBlockManager.getModel */
  getModel(index?: number): BlockModel | null {
    const outIndex = index === undefined
      ? this.getIndex()
      : index;

    const el = this.getElement(outIndex);

    if (!el) return null;

    return el.baseModel;
  }

  /** @see IBlockManager.removeBlock */
  removeBlock(
    index: number | number[] = -1,
    skipEvents: boolean = false
  ): number | null {
    const { config, events } = this.editor;

    let lastRemovedIndex: number = 0;
    let lastRemovedBlock: HTMLElement | null = null;

    if (Array.isArray(index)) {
      if (index.length === 0) return null;

      const sortedIndices = [...index].sort((a, b) => b - a);

      for (const currentIndex of sortedIndices) {
        const el = this.getElement(currentIndex);
        if (el) {
          lastRemovedIndex = currentIndex;
          lastRemovedBlock = el;
          el.remove();
        }
      }
    } else {
      let blockElement: HTMLElement | null = null;
      let currentIndex: number | null = null;

      if (index !== -1) {
        blockElement = this.getElement(index);
        currentIndex = index;
      } else {
        blockElement = this.getElement();
        currentIndex = this.getIndex();
      }

      if (!blockElement || currentIndex === null) return null;

      lastRemovedIndex = currentIndex;
      lastRemovedBlock = blockElement;
      blockElement.remove();
    }

    if (!skipEvents) {
      const focusIndex = lastRemovedIndex - 1;
      setTimeout(() => this.focus(focusIndex <= 0 ? 0 : focusIndex), 100);

      const defBlock = config.get("defaultBlock", "p");

      if (this.count() == 0) {
        this.createBlock(defBlock);
      }

      events.change({
        type: "removeBlock",
        index: lastRemovedIndex || 0,
        blockElement: lastRemovedBlock
      });
    }

    events.refresh();

    return lastRemovedIndex;
  }

  /** @see IBlockManager.createDefaultBlock */
  createDefaultBlock(
    index: number = -1,
    options?: BlockCreateSchema): BlockElement | null {
    return this.createBlock(
      this.editor.config.get("defaultBlock", "p"),
      index,
      options
    );
  }

  /** @see IBlockManager.createBlock */
  createBlock(
    name: string,
    index: number = -1,
    options?: BlockCreateSchema,
    skipEvents: boolean = false
  ): BlockElement | null {
    let block: BlockElement | null = null;
    const { events } = this.editor,
      schemas = this.getSchemas();

    (schemas).forEach(
      (schema: BlockModelSchema) => {
        const names = schema.model.getSupportedNames();
        if (names.length && names.includes(name)) {
          const blockInstance: BlockModel = new schema.constructor(this.editor);
          const createBlock = (to: string = 'end') => {
            const blockContainer = this.getBlocksContainer();

            if (blockContainer) {
              block = executeMethodIfExists(blockInstance, '__compose', [options]) as BlockElement;

              if (block) {
                if (to == 'start')
                  prepend(blockContainer, block)
                else
                  append(blockContainer, block);
              }
            }
          }

          let curIndex = index !== -1 ? index : this.getIndex();

          if (blockInstance) {
            if (this.count() === 0) {
              createBlock();
            } else {
              if (this.count() <= curIndex + 1) {
                createBlock();
                curIndex = this.count() - 1;
              } else {
                if (curIndex === 0 && index === 0) {
                  createBlock('start');
                  curIndex = 0;
                } else {

                  const curBlock = this.getElement(curIndex);
                  block = executeMethodIfExists(blockInstance, '__compose', [options]) as BlockElement;

                  if (curBlock && block) {
                    if (curIndex != index) {
                      after(curBlock, block);
                      curIndex++;
                    } else {
                      before(curBlock, block);
                    }
                  }
                }
              }
            }

            if (block) {
              executeMethodIfExists(blockInstance, '__onMount');

              if (!skipEvents) {
                events.change({
                  type: "createBlock",
                  index: curIndex,
                  blockElement: block
                });

                setTimeout(() => this.focus(curIndex), 5);
              }
            }
          }
        }
      }
    );

    if (!skipEvents)
      events.refresh();

    return block;
  }

  /** @see IBlockManager.moveBlock */
  moveBlock(
    index: number,
    targetIndex: number,
    skipEvents: boolean = false
  ): void {
    const { events } = this.editor,
      blockContainer = this.getBlocksContainer(),
      blockElement = this.getElement(),
      length = this.count();

    if (!blockContainer) return;

    if (length === 0) return;

    let realIndex = index;
    if (realIndex < 0) realIndex = 0;
    if (realIndex >= length) realIndex = length - 1;

    let realTargetIndex = targetIndex;
    if (realTargetIndex <= 0) {
      realTargetIndex = 0;
    } else if (realTargetIndex >= length) {
      realTargetIndex = length - 1;
    }

    if (realIndex === realTargetIndex) return;

    if (!blockElement) return;

    blockElement.remove();

    if (realTargetIndex === 0) {
      prepend(blockContainer, blockElement);
    } else {
      if (realTargetIndex >= length - 1) {
        append(blockContainer, blockElement);
      } else {
        const insertAfterIndex = realTargetIndex - 1;
        const targetBlock = this.getElement(insertAfterIndex);

        if (targetBlock) {
          after(targetBlock, blockElement);
        } else {
          append(blockContainer, blockElement);
        }
      }
    }

    if (!skipEvents) {
      this.focus(realTargetIndex);
      events.change({
        type: 'moveBlock',
        blockElement: blockElement,
        index: index,
        targetIndex: realTargetIndex
      });
    }
  }

  /** @see IBlockManager.merge */
  merge(
    index: number,
    targetIndex: number,
    focus?: number,
    useItems?: boolean
  ): void {
    let itemIndex = 0;
    const { events } = this.editor;
    const blockElement = this.getElement(index),
      targetBlockElement = this.getElement(targetIndex);

    if (blockElement && targetBlockElement) {
      const model = blockElement.baseModel,
        targetModel = targetBlockElement.baseModel;

      const contentElement = model.getContentElement(),
        targetContentElement = targetModel.getContentElement();

      const appendChildNodes = (target: HTMLElement, el: HTMLElement) => {
        appendText(target, ' ');

        if (targetModel.isRaw())
          appendText(target, getText(el));
        else
          append(target, getChildNodes(el));
      }

      if (contentElement && targetContentElement) {
        const mergeTextToChild = (child: HTMLElement) => {
          const itemsLength = targetModel.getItemsLength();

          if (itemsLength) {
            itemIndex = itemsLength - 1;
            const itemBodyNode = targetModel.getItemBody(itemsLength - 1);

            if (itemBodyNode) {
              appendChildNodes(itemBodyNode, child);
            }

            if (model.isEmpty()) {
              blockElement.remove();
            }
          } else {
            targetBlockElement.remove();
          }
        };

        const mergeChildToText = (child: HTMLElement) => {
          if (useItems) {
            const allItems = model.getItems();

            if (allItems.length) {
              let i = 0;
              allItems.forEach(() => {
                const itemBodyNode = model.getItemBody(i);

                if (itemBodyNode)
                  appendChildNodes(child, itemBodyNode);

                i++;
              });

              blockElement.remove();
            }
          } else {
            const itemBodyNode = model.getItemBody(0);

            if (itemBodyNode) {
              appendChildNodes(child, itemBodyNode);
              model.removeItem(0);
            }
          }
        };

        const mergeChildToChild = () => {
          if (useItems) {
            const allItems = model.getItems();

            if (allItems.length) {
              allItems.forEach((_, i) => {
                const itemBodyNode = model.getItemBody(i);
                if (itemBodyNode) {
                  const itemsLength = targetModel.getItemsLength();
                  itemIndex = itemsLength - 1;
                  const targetItemBodyNode = targetModel.getItemBody(itemsLength - 1);

                  if (targetItemBodyNode) {
                    appendChildNodes(targetItemBodyNode, itemBodyNode);
                  }
                }
              });

              blockElement.remove();
            }
          } else {
            const itemBodyNode = model.getItemBody(0);

            if (itemBodyNode) {
              const itemsLength = targetModel.getItemsLength();
              itemIndex = itemsLength - 1;
              const targetItemBodyNode = targetModel.getItemBody(itemsLength - 1);

              if (targetItemBodyNode) {
                appendChildNodes(targetItemBodyNode, itemBodyNode);
                model.removeItem(0);
              }
            }
          }
        };

        const autoMerge = model.getConfig('autoMerge'),
          targetAutoMerge = targetModel.getConfig('autoMerge'),
          targetLength = getLength(targetContentElement);

        const editableChild = model?.isEditableItems(),
          targetEditableChild = targetModel.isEditableItems();

        // Auto-merge
        if (autoMerge && targetAutoMerge) {
          // text -> text
          if (!editableChild && !targetEditableChild) {
            appendChildNodes(targetContentElement, contentElement);
            blockElement.remove();
          }
          // list/child -> list/child
          else if (editableChild && targetEditableChild) {
            mergeChildToChild();
          }
          // list/child -> text
          else if (editableChild && !targetEditableChild) {
            mergeChildToText(targetContentElement)
          }
          // text -> list/child
          else if (!editableChild && targetEditableChild) {
            mergeTextToChild(contentElement);
          }
        }
        // Custom -> target (target has autoMerge)
        else if (!autoMerge && targetAutoMerge) {
          const mergeNode = executeMethodIfExists(model, '__merge') as HTMLElement | null;

          if (mergeNode) {
            // custom -> list/child
            if (targetEditableChild) {
              mergeTextToChild(mergeNode)
            }
            // custom -> text
            else {
              appendChildNodes(targetContentElement, mergeNode);
            }
          }
        }
        // Source (autoMerge) -> Custom
        else if (autoMerge && !targetAutoMerge) {
          const targetMergeNode = executeMethodIfExists(targetModel, '__merge') as HTMLElement | null;
          if (targetMergeNode) {
            // list/child -> custom
            if (editableChild && !targetEditableChild) {
              mergeChildToText(targetMergeNode);
            }
            // text -> custom
            else if (!editableChild && !targetEditableChild) {
              appendChildNodes(targetMergeNode, contentElement);
              blockElement.remove();
            }
            // list/child -> custom (when target is editableChild)
            else if (editableChild && targetEditableChild) {
              // This case might need special handling
              mergeChildToText(targetMergeNode);
            }
          }
        }
        // Both custom
        else if (!autoMerge && !targetAutoMerge) {
          const mergeNode = executeMethodIfExists(model, '__merge') as HTMLElement | null;
          const targetMergeNode = executeMethodIfExists(targetModel, '__merge') as HTMLElement | null;

          if (mergeNode && targetMergeNode) {
            // Handle all combinations when both are custom
            if (editableChild && targetEditableChild) {
              // list/child -> list/child (both custom)
              const allItems = model.getItems();
              if (allItems.length) {
                allItems.forEach((_, i) => {
                  const itemBodyNode = model.getItemBody(i);
                  if (itemBodyNode) {
                    mergeTextToChild(itemBodyNode);
                  }
                });
                blockElement.remove();
              }
            }
            else if (editableChild && !targetEditableChild) {
              // list/child -> text
              mergeChildToText(targetMergeNode);
            }
            else if (!editableChild && targetEditableChild) {
              // text -> list/child
              mergeTextToChild(mergeNode);
            }
            else {
              // text -> text
              appendChildNodes(targetMergeNode, mergeNode);
              blockElement.remove();
            }
          }
        }

        if (model.isEmpty()) {
          blockElement.remove();
        }

        if (blockElement) {
          model.sanitize()
        }

        targetModel.sanitize();

        const focusIndex = focus !== undefined
          ? focus
          : this.getIndex(targetBlockElement);

        this.focus(
          focusIndex,
          targetLength + 1,
          undefined,
          itemIndex
        );

        events.change({
          type: 'mergeBlocks',
          blockElement: targetBlockElement,
          contentElement: this.getContentElement(targetBlockElement),
          targetIndex: targetIndex,
          index: index
        });
      }
    }

    events.refresh();
  }

  /** @see IBlockManager.convert */
  convert(blockElement: BlockElement, targetModel: BlockModel): boolean {
    const { events } = this.editor;
    const model = blockElement.baseModel,
      curIndex = this.getIndex(blockElement);

    const [beforeBlockElement, beforeTargetModel] = executeMethodIfExists(
      model,
      '__beforeConvert',
      [blockElement, targetModel]
    ) as [BlockElement, BlockModel];

    if (model.isConvertible() && beforeTargetModel.isConvertible()) {
      if (!beforeBlockElement)
        return false;

      const targetBlockElement = executeMethodIfExists(beforeTargetModel, '__compose') as BlockElement;

      const createItem = (target: HTMLElement, content: string) => {
        const newItem = executeMethodIfExists(beforeTargetModel, '__makeItemElement', [content]) as HTMLElement
        append(target, newItem);
      }

      if (targetBlockElement) {
        const contentElement = this.getContentElement(beforeBlockElement),
          targetContentElement = this.getContentElement(targetBlockElement),
          editableItems = model.isEditableItems(),
          isTargetEditableItems = beforeTargetModel.isEditableItems(),
          sanitizerConfig = beforeTargetModel.getSanitizerConfig(),
          isSanitize = Object.keys(sanitizerConfig).length,
          isRaw = beforeTargetModel.isRaw();

        if (contentElement && targetContentElement) {
          const appendContent = (target: HTMLElement, source: HTMLElement) => {
            if (isRaw || !isSanitize) {
              appendText(target, getText(source));
            } else {
              append(target, getChildNodes(source));
            }
          };

          // Case 1: text -> text (both not editable child)
          if (!editableItems && !isTargetEditableItems) {
            appendContent(targetContentElement, contentElement);
          }

          // Case 2: list/child -> text
          else if (editableItems && !isTargetEditableItems) {
            const items = model.getItems();

            if (items && items.length) {
              items.forEach((item: HTMLElement, index: number) => {
                const itemBodyNode = model.getItemBody(index);
                if (itemBodyNode) {
                  if (index > 0) appendText(targetContentElement, ' ');
                  appendContent(targetContentElement, itemBodyNode);
                }
              });
            } else
              return false;
          }

          // Case 3: text -> list/child
          else if (!editableItems && isTargetEditableItems) {
            html(targetContentElement, '');
            createItem(targetContentElement, html(contentElement));
          }

          // Case 4: list/child -> list/child
          else if (editableItems && isTargetEditableItems) {
            const items = model.getItems(),
              isSingleItem = beforeTargetModel.isSingleItem();

            if (items && items.length) {
              html(targetContentElement, '');
              const childNodes: Node[] = [];

              items.forEach((_item: HTMLElement, index: number) => {
                const itemBodyNode = model.getItemBody(index);
                if (itemBodyNode) {
                  if (isSingleItem) {
                    getChildNodes(itemBodyNode).forEach((child) => {
                      childNodes.push(child);
                    });
                  } else
                    createItem(targetContentElement, html(itemBodyNode));
                }
              });

              if (isSingleItem && childNodes.length) {
                const temp = make(
                  'div',
                  (div: HTMLDivElement) => append(div, childNodes)
                );
                createItem(targetContentElement, html(temp));
              }
            }
          }
        }

        after(beforeBlockElement, targetBlockElement);

        if (isSanitize) {
          beforeTargetModel.sanitize();
        }

        beforeBlockElement.remove();
        this.focus(curIndex);
      }

      const afterBlockElement = executeMethodIfExists(targetModel, '__afterConvert', [targetBlockElement]) as BlockElement;

      events.change({
        type: "convertBlock",
        index: curIndex,
        blockElement: afterBlockElement
      });

      events.refresh();
    }

    return true;
  }

  /** @see IBlockManager.getModels */
  getModels(): BlockModel[] {
    const elements = this.getBlocks();

    if (!elements.length)
      return []

    const models: BlockModel[] = [];

    elements.forEach(
      (el: BlockElement) => models.push(el.baseModel)
    );

    return models;
  }

  /** @see IBlockManager.getSchemas */
  getSchemas(): BlockModelSchema[] {
    if (this.blockSchemas.length > 0) return this.blockSchemas;

    const blockModels = this.editor.config.get("blocks", []);

    if (!blockModels) return [];

    if (blockModels.length == 0)
      blockModels.push(Paragraph);

    (blockModels).forEach(
      (constructor: BlockModelConstructor) => {
        const model = new constructor(this.editor);

        this.blockSchemas.push({
          constructor: constructor,
          model: model
        });
      }
    );

    return this.blockSchemas;
  }

  /** @see IBlockManager.getSchema */
  getSchema(name: string): BlockModelSchema | null {
    let schema = null;

    (this.getSchemas()).forEach((schemaItem: BlockModelSchema) => {
      const model = schemaItem.model;
      const names = model.getSupportedNames();

      if (names.length && names.includes(name)) {
        schema = schemaItem;
      }
    });

    return schema;
  }

  /** @see IBlockManager.getRealName */
  getRealName(name: string): string | null {
    const schema = this.getSchema(name);

    if (!schema)
      return null;

    return schema.model.getName();
  }

  /** @see IBlockManager.htmlToData */
  htmlToData(html: string): Array<BlockSchema | string> {
    const nodes = parseHtml(html);

    if (!nodes.length) return [];

    const result: Array<BlockSchema | string> = [];
    const isPlainText = nodes.length === 1 && nodes[0].nodeType === Node.TEXT_NODE;
    const isTextWithBr = nodes[0].nodeType === Node.TEXT_NODE &&
      nodes.length === 2 &&
      nodes[1].nodeName === "BR";

    if (!isPlainText && !isTextWithBr) {
      nodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent;
          if (text?.trim()) result.push(text);
        }
        else if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          const objAttr: Record<string, string> = {};

          let outContent: Array<BlockSchema | string> = [];

          if (element.childNodes.length) {
            const hasComplexChildren = element.childNodes.length !== 1 ||
              element.childNodes[0].nodeType !== Node.TEXT_NODE;
            if (hasComplexChildren) {
              outContent = this.htmlToData(element.innerHTML);
            } else {
              const text = element.childNodes[0].textContent;
              if (text?.trim()) outContent = [text];
            }
          }

          const outData: BlockSchema = {
            type: node.nodeName.toLowerCase(),
            data: outContent as BlockSchemaData | []
          };

          if (element.attributes.length) {
            Array.from(element.attributes).forEach(({ name, value }) => {
              objAttr[name] = value;
            });
            outData.attr = objAttr;
          }

          result.push(outData);
        }
      });
    }
    else {
      const cleanedHtml = html.replace(/&nbsp;/g, " ");
      result.push(decodeHtmlSpecialChars(cleanedHtml));
    }

    return result;
  }

  /** @see IBlockManager.parseBlock */
  parseBlock(
    blockSchema: BlockSchema,
    skipDecode: boolean = false
  ): BlockElement | null {
    const modelSchema = this.getSchema(blockSchema.type);

    if (!modelSchema)
      return null;

    let blockElement = null;
    const blockModel = new modelSchema.constructor(this.editor),
      newSchema: BlockCreateSchema = { ...blockSchema };

    delete newSchema.type;

    if (blockModel.isAutoParse()) {
      const editableItems = blockModel.isEditableItems();

      if (editableItems) {
        const blockData = (blockSchema?.data || []) as BlockSchema[];

        if (blockData.length) {
          const items: BlockCreateItemSchema[] = [],
            supportedItemNames = blockModel.getItemSupportedNames();

          blockData.forEach(item => {
            if (
              item.type &&
              supportedItemNames.includes(item.type) &&
              item.data.length
            ) {
              const nodes = this.parseChildren(item),
                itemData: BlockCreateItemSchema = {
                  type: item.type,
                  data: toHtml(nodes)
                };

              if (item.attr && Object.keys(item.attr).length) {
                itemData.attr = item.attr;
              }

              items.push(itemData);
            }
          });

          if (items.length) {
            newSchema.data = items;
            blockElement = executeMethodIfExists(
              blockModel, '__compose',
              [newSchema]
            ) as BlockElement
          }
        }
      } else {
        const nodes = this.parseChildren(blockSchema, skipDecode);
        if (nodes) {
          newSchema.data = toHtml(nodes);

          blockElement = executeMethodIfExists(
            blockModel,
            '__compose',
            [newSchema]
          ) as BlockElement;
        }

      }
    } else {
      if ('__parse' in blockModel) {
        const parsedSchema = executeMethodIfExists(
          blockModel,
          '__parse',
          [blockSchema]
        ) as BlockCreateSchema;

        blockElement = executeMethodIfExists(
          blockModel,
          '__compose',
          [parsedSchema]
        ) as BlockElement;
      }
    }

    return blockElement;
  }

  /** @see IBlockManager.parseBlocks */
  parseBlocks(
    data: BlockSchema[],
    skipDecode: boolean = false
  ): BlockElement[] {
    const blockElements: BlockElement[] = [];

    data.forEach((blockSchema) => {
      const newBlock = this.parseBlock(blockSchema, skipDecode);

      if (newBlock)
        blockElements.push(newBlock);
    });

    return blockElements;
  }

  /** @see IBlockManager.parseChildren */
  parseChildren(
    schema: BlockSchema | BlockChildSchema,
    skipDecode: boolean = false,
    returnElement: boolean = false
  ): Node[] {
    if (!schema?.type || schema.data === null || schema.data === undefined) {
      return [];
    }

    const element = make(schema.type);

    if (Array.isArray(schema.data)) {
      (schema.data as (BlockSchema | string)[]).forEach((item) => {
        if (typeof item === "string") {
          const text = skipDecode ? item : decodeHtmlSpecialChars(item);
          appendText(element, text);
        } else {
          const childElements = this.parseChildren(item, skipDecode, true);
          childElements.forEach((childNode) => {
            append(element, childNode as HTMLElement);
          });
        }
      });
    } else if (typeof schema.data === "string") {
      const text = skipDecode ? schema.data : decodeHtmlSpecialChars(schema.data);
      appendText(element, text);
    }

    if (schema.attr) {
      for (const attrKey in schema.attr) {
        if (schema.attr[attrKey] !== undefined) {
          const attribute = schema.attr[attrKey];

          if (typeof attribute === 'boolean' || typeof attribute === 'number') {
            attr(element, attrKey, attribute);
          } else {
            attr(element, attrKey, decodeHtmlSpecialChars(attribute.toString()));
          }
        }
      }
    }

    return returnElement ? [element] : getChildNodes(element);
  }

  /** @see IBlockManager.destroy */
  destroy(): void {
    this.getModels().forEach((model) => model.destroy());
    this.getSchemas().forEach((schema) => schema.model.destroy());

    off(document, 'click.notActive' + this.eventId);
    this.destroyVirtualSelection();
  }
}