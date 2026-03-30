import type {
  BlockManagerInterface,
  BlockNode,
  TexditorInterface,
  BlockModelInstanceInterface,
  BlockModelInterface,
  BlockModelStructure,
  BlockCreateOptions
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
  before
} from "@/utils/dom";
import { off, rebind } from "@/utils/events";
import { Paragraph } from "@/blocks";
import VirtualSelection from "./ui/virtual-selection";
import { VirtualSelectionInterface } from "@/types/core/ui/virtual-selection";
import { globalStore } from "@/store/globalStore";
export default class BlockManager implements BlockManagerInterface {
  /** Reference to the main editor instance */
  private editor: TexditorInterface;

  /** Current active block index */
  private blockIndex: number = 0;

  /** Cached block model configurations */
  private blockModels: BlockModelStructure[] = [];

  /** VirtualSelection */
  private virtualSelection: VirtualSelectionInterface | null = null;

  constructor(editor: TexditorInterface) {
    this.editor = editor;
  }

  /**
 * Creates or recreates the VirtualSelection instance with current options
 * If an instance already exists, it will be destroyed first
 * @returns {VirtualSelectionInterface | null}
 */
  refreshVirtualSelection(): VirtualSelectionInterface | null {
    this.destroyVirtualSelection();

    const { api, config, toolbar } = this.editor
    const blocksContainer = this.getBlocksContainer();

    if (blocksContainer) {
      const selectionZone = config.get(
        'selectionZoneElement',
        api.getRoot() || document.body
      );

      this.virtualSelection = new VirtualSelection({
        blocksContainer: blocksContainer,
        blockSelector: '.tex-block',
        selectionZone: selectionZone,
        exitTolerance: 16,
        touchActivationDelay: 250,
        selectedBlockClass: 'selection-block-selected',
        onLassoStart: () => {
          toolbar.hide();
        },
        onSelectionChange: () => {
          // TODO: refresh exts
        }
      });
    }

    return this.virtualSelection;
  }

  /**
 * Returns the current VirtualSelection instance if it exists
 * @returns {VirtualSelectionInterface | null} 
 */
  getVirtualSelection(): VirtualSelectionInterface | null {
    return this.virtualSelection || this.refreshVirtualSelection();
  }

  /**
  * Clear Selection UI
  * @returns {void}
  */
  clearVirtualSelection(): void {
    const virtualSelection = this.getVirtualSelection();

    if (virtualSelection && virtualSelection.getSelectedIndices())
      virtualSelection.clearSelection();
  }

  /**
 * Gets the container element that holds all blocks
 * @returns The blocks container element or null if not found
 */
  destroyVirtualSelection(): void {
    if (this.virtualSelection) {
      this.virtualSelection.destroy();
      this.virtualSelection = null;
    }
  }

  /**
   * Gets the container element that holds all blocks
   * @returns The blocks container element or null if not found
   */
  getBlocksContainer(): HTMLElement | null {
    const root = this.editor.api.getRoot();

    if (!root)
      return null;

    const [container] = queryList('.tex-blocks', root);

    return container || null;
  }

  /**
   * Sets focus to a specific block by index
   * @param index - Block index to focus
   * @param startPos - Starting the selection position
   * @param endPos - End of selection position
   * @param itemIndex - Item index
   * @returns The focused block node or null if focus failed
   */
  focus(
    index: number,
    startPos?: number,
    endPos?: number,
    itemIndex?: number
  ): BlockNode | null {
    const blockNode = this.getBlockNode(index),
      model = blockNode?.blockModel,
      { selectionApi } = this.editor;

    if (!model)
      return null;

    if (!blockNode)
      return null;

    const contentNode = this.getContentNode(blockNode);
    const selectEnd = (el: HTMLElement) => {
      const length = getLength(el) || 0

      if (length) {
        const start = startPos || length || 0,
          end = endPos || startPos || length || 0;

        blockNode.click();
        el.focus();

        selectionApi.select(start, end, el);
      } else {
        el.focus();
      }
    };

    if (contentNode) {
      contentNode.click();

      if (model?.isEditable() && !model.isEditableItems()) {
        selectEnd(contentNode);
      } else if (model?.isEditableItems()) {
        const item = typeof itemIndex === 'number'
          ? model.getItemBody(itemIndex)
          : (model.getItem(-1) as HTMLElement | null || model.getItemBody(0));

        if (item)
          selectEnd(item);
      } else {
        contentNode.click();
      }
    }

    return blockNode;
  }

  /**
   * Gets all block nodes in the editor
   * @returns Array of block nodes
   */
  getBlocks(): BlockNode[] {
    const nodes: BlockNode[] = [],
      blockContainer = this.getBlocksContainer();

    if (blockContainer) {
      query(
        '.tex-block',
        (el: BlockNode) => nodes.push(el),
        blockContainer
      );
    }

    return nodes;
  }

  /**
   * Gets a specific block node by index
   * @param index - Block index (defaults to current index)
   * @returns Block node or null if not found
   */
  getBlockNode(index?: number): BlockNode | null {
    const realIndex = index !== undefined ? index : this.getIndex(),
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

  /**
   * Gets the content node within a block
   * @param blockNode - Block node (defaults to current block)
   * @returns Content element or null
   */
  getContentNode(blockNode?: BlockNode): HTMLElement | null {
    const realBlockNode = blockNode || this.getBlockNode();

    if (!realBlockNode)
      return null;

    const [content] = queryList('.tex-block-content', realBlockNode);

    return content || null;
  }

  /**
   * Gets the next block node after current active block
   * @returns Next block node or null
   */
  getNextBlockNode(): BlockNode | null {
    const currentIndex = this.getIndex();

    return this.getBlockNode(currentIndex + 1);
  }

  /**
   * Gets the previous block node before current active block
   * @returns Previous block node or null
   */
  getPrevBlockNode(): BlockNode | null {
    const currentIndex = this.getIndex();

    return this.getBlockNode(currentIndex - 1);
  }

  /**
   * Finds parent block of a target element
   * @param targetNode - Target element or event target
   * @returns Parent block node or null
   */
  findParent(targetNode: EventTarget | HTMLElement): BlockNode | null {
    let node = null;
    const container = this.getBlocksContainer();

    if (container) {
      query(
        '.tex-block',
        (el: HTMLElement) => {
          if (closest(targetNode, el)) node = el;
        },
        container
      );
    }

    return node;
  }

  /**
   * Sets the active block index and updates UI
   * @param index - Block index to set as active
   */
  use(index: number) {
    const { actions, api } = this.editor,
      cssName = 'tex-block',
      root = api.getRoot(),
      blockNode = this.getBlockNode(index);

    this.blockIndex = index;
    this.clearVirtualSelection();

    if (root && blockNode) {
      globalStore.set('el', root);
      globalStore.set('index', index);

      query(
        "." + cssName,
        (block: BlockNode) => {
          removeClass(block, cssName + "-active");
        },
        root
      );

      addClass(blockNode, cssName + "-active")
      actions.create(blockNode);
      rebind(document, 'dblclick.unactive', () => {
        removeClass(blockNode, cssName + "-active");
      });
    }
  }

  /**
   * Gets the index of a block
   * @param node - Target node (defaults to current block)
   * @param findParent - Whether to find parent block of the node
   * @returns Block index
   */
  getIndex(
    node?: BlockNode | HTMLElement | EventTarget,
    findParent?: boolean
  ): number {
    if (!node)
      return this.blockIndex;

    let index = 0;

    const container = this.getBlocksContainer();

    if (container) {
      const realNode = findParent ? this.findParent(node) : node;

      query(
        '.tex-block',
        (el: HTMLElement, i: number) => {
          if (realNode === el) index = i;
        },
        container
      );
    }

    return index;
  }

  /**
   * Checks if a block is a text block (editable but no child blocks)
   * @param blockNode - Block node to check
   * @returns True if text block
   */
  isTextBlock(blockNode: BlockNode | null): boolean {
    if (!blockNode) return false;

    const model = blockNode.blockModel;

    return model?.getConfig("editable") && !model?.getConfig("editableItems");
  }

  /**
   * Gets the total number of blocks
   * @returns Block count
   */
  count(): number {
    const blocksContainer = this.getBlocksContainer();

    if (!blocksContainer)
      return 0;

    return queryLength('.tex-block', blocksContainer);
  }

  /**
   * Checks if a block is empty
   * @param index - Block index (defaults to current block)
   * @returns True if block is empty
   */
  isEmpty(index?: number): boolean {
    const model = this.getModel(index);

    if (!model)
      return true;

    return model.isEmpty();
  }

  /**
   * Updates empty state data attributes on blocks
   * @param emptyAttr - Whether to set empty attribute
   */
  detectEmpty(emptyAttr: boolean = true) {
    const container = this.getBlocksContainer();

    if (container) {
      query(
        '.tex-block',
        (blockNode: BlockNode) => {
          if (blockNode.blockModel?.isEmptyDetect()) {
            const index = this.getIndex(blockNode);
            const contentNode = this.getContentNode(blockNode);

            if (contentNode) {
              contentNode.dataset["empty"] = !emptyAttr
                ? "false"
                : this.isEmpty(index)
                  ? "true"
                  : "false";
            }
          }
        },
        container
      );
    }
  }

  /**
   * Normalizes all blocks that require normalization
   */
  normalize() {
    const items = this.getBlocks(),
      { commands } = this.editor;

    items.forEach((blockNode: BlockNode) => {
      const model = blockNode.blockModel;

      if (
        (model?.isEditable() || model?.isEditableItems()) &&
        model?.isNormalize()
      ) {
        const container = model.normalizeContainer();

        if (container) {
          if (Array.isArray(container)) {
            container.forEach((el: HTMLElement | BlockNode) => {
              commands.normalize(el as HTMLElement);
            });
          } else {
            commands.normalize(container as HTMLElement);
          }
        }
      }
    });
  }

  /**
   * Gets the block model for a specific block
   * @param index - Block index (defaults to current block)
   * @returns Block model or null
   */
  getModel(index?: number): BlockModelInterface | null {
    const outIndex = index === undefined ? this.getIndex() : index,
      block = this.getBlockNode(outIndex);

    if (!block) return null;

    return block.blockModel;
  }

  /**
   * Removes one or multiple blocks
   * @param index - Index of the block to delete (-1 to the current block)
   * @param skipEvents - If true, no events will be emitted and focus won't be automatically managed
   * @returns Index of last removed block or null
   */
  removeBlock(index: number | number[] = -1, skipEvents: boolean = false): number | null {
    const { config, events } = this.editor;

    let lastRemovedIndex: number = 0;
    let lastRemovedBlock: HTMLElement | null = null;

    if (Array.isArray(index)) {
      if (index.length === 0) return null;

      const sortedIndices = [...index].sort((a, b) => b - a);

      for (const currentIndex of sortedIndices) {
        const node = this.getBlockNode(currentIndex);
        if (node) {
          lastRemovedIndex = currentIndex;
          lastRemovedBlock = node;
          node.remove();
        }
      }
    } else {
      let blockNode: HTMLElement | null = null;
      let currentIndex: number | null = null;

      if (index !== -1) {
        blockNode = this.getBlockNode(index);
        currentIndex = index;
      } else {
        blockNode = this.getBlockNode();
        currentIndex = this.getIndex();
      }

      if (!blockNode || currentIndex === null) return null;

      lastRemovedIndex = currentIndex;
      lastRemovedBlock = blockNode;
      blockNode.remove();
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
        blockNode: lastRemovedBlock
      });
    }

    events.refresh();

    return lastRemovedIndex;
  }

  /**
   * Creates a default block based on editor configuration
   * @returns Created block node or null
   */
  createDefaultBlock(): BlockNode | null {
    return this.createBlock(
      this.editor.config.get("defaultBlock", "p")
    );
  }

  /**
   * Creates a new block of specified type
   * @param name - Block type name
   * @param index - Index of the block to create (-1 after the current block)
   * @param options - Block Options
   * @param skipEvents - If true, no events will be emitted and focus won't be automatically managed
   * @returns Created block node or null
   */
  createBlock(
    name: string,
    index: number = -1,
    options: BlockCreateOptions = {},
    skipEvents: boolean = false
  ): BlockNode | null {
    const { events } = this.editor,
      blockModels = this.getBlockModels();

    (blockModels).forEach(
      (formatedModel: BlockModelStructure) => {
        if (formatedModel.types && formatedModel.types.includes(name)) {
          const blockInstance: BlockModelInterface = new formatedModel.instance(
            this.editor
          );

          let block = null;

          const createBlock = (to: string = 'end') => {
            const blockContainer = this.getBlocksContainer();

            if (blockContainer) {
              block = blockInstance.create(options);

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

                  const curBlock = this.getBlockNode(curIndex);
                  block = blockInstance.create(options);

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
              if (!skipEvents)
                this.focus(curIndex);

              if (blockInstance.afterCreate)
                blockInstance.afterCreate(block as BlockNode);

              if (!skipEvents) {
                events.change({
                  type: "createBlock",
                  index: curIndex,
                  blockNode: block
                });
              }

              return block;
            }
          }
        }
      }
    );

    events.refresh();

    return null;
  }

  /**
   * Merges two blocks together
   * @param index - Block index
   * @param targetIndex - Target block index
   * @param focus - The index of the focus block
   * @param useItems - Use all the contents of the editable child elements
   */
  merge(
    index: number,
    targetIndex: number,
    focus?: number,
    useItems?: boolean
  ) {
    let itemIndex = 0;
    const { events } = this.editor;
    const blockNode = this.getBlockNode(index),
      targetBlockNode = this.getBlockNode(targetIndex);

    if (blockNode && targetBlockNode) {
      const model = blockNode.blockModel,
        targetModel = targetBlockNode.blockModel;

      const contentNode = model.getContentNode(),
        targetContentNode = targetModel.getContentNode();

      const appendChildNodes = (target: HTMLElement, el: HTMLElement) => {
        appendText(target, ' ');

        if (targetModel.isRaw())
          appendText(target, getText(el));
        else
          append(target, getChildNodes(el));
      }

      if (contentNode && targetContentNode) {
        const mergeTextToChild = (node: HTMLElement) => {
          const itemsLength = targetModel.getItemsLength();

          if (itemsLength) {
            itemIndex = itemsLength - 1;
            const itemBodyNode = targetModel.getItemBody(itemsLength - 1);

            if (itemBodyNode) {
              appendChildNodes(itemBodyNode, node);
            }

            if (model.isEmpty()) {
              blockNode.remove();
            }
          } else {
            targetBlockNode.remove();
          }
        };

        const mergeChildToText = (node: HTMLElement) => {
          if (useItems) {
            const allItems = model.getItems();

            if (allItems.length) {
              let i = 0;
              allItems.forEach(() => {
                const itemBodyNode = model.getItemBody(i);

                if (itemBodyNode)
                  appendChildNodes(node, itemBodyNode);

                i++;
              });

              blockNode.remove();
            }
          } else {
            const itemBodyNode = model.getItemBody(0);

            if (itemBodyNode) {
              appendChildNodes(node, itemBodyNode);
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

              blockNode.remove();
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
          targetLength = getLength(targetContentNode);

        const editableChild = model?.isEditableItems(),
          targetEditableChild = targetModel.isEditableItems();

        // Auto-merge
        if (autoMerge && targetAutoMerge) {
          // text -> text
          if (!editableChild && !targetEditableChild) {
            appendChildNodes(targetContentNode, contentNode);
            blockNode.remove();
          }
          // list/child -> list/child
          else if (editableChild && targetEditableChild) {
            mergeChildToChild();
          }
          // list/child -> text
          else if (editableChild && !targetEditableChild) {
            mergeChildToText(targetContentNode)
          }
          // text -> list/child
          else if (!editableChild && targetEditableChild) {
            mergeTextToChild(contentNode);
          }
        }
        // Custom -> target (target has autoMerge)
        else if (!autoMerge && targetAutoMerge) {
          const mergeNode = model.merge();
          if (mergeNode) {
            // custom -> list/child
            if (targetEditableChild) {
              mergeTextToChild(mergeNode)
            }
            // custom -> text
            else {
              appendChildNodes(targetContentNode, mergeNode);
            }
          }
        }
        // Source (autoMerge) -> Custom
        else if (autoMerge && !targetAutoMerge) {
          const targetMergeNode = targetModel.merge();
          if (targetMergeNode) {
            // list/child -> custom
            if (editableChild && !targetEditableChild) {
              mergeChildToText(targetMergeNode);
            }
            // text -> custom
            else if (!editableChild && !targetEditableChild) {
              appendChildNodes(targetMergeNode, contentNode);
              blockNode.remove();
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
          const mergeNode = model.merge();
          const targetMergeNode = targetModel.merge();

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
                blockNode.remove();
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
              blockNode.remove();
            }
          }
        }

        if (model.isEmpty()) {
          blockNode.remove();
        }

        if (blockNode) {
          model.sanitize();
        }

        targetModel.sanitize();

        const focusIndex = focus !== undefined
          ? focus
          : this.getIndex(targetBlockNode);

        this.focus(
          focusIndex,
          targetLength + 1,
          undefined,
          itemIndex
        );

        events.change({
          type: 'mergeBlocks',
          blockNode: targetBlockNode,
          contentNode: this.getContentNode(targetBlockNode),
          targetIndex: targetIndex,
          index: index
        });
      }
    }

    events.refresh();
  }

  /**
   * Converts a block to a different type
   * @param blockNode - Block to convert
   * @param targetModel - Target block model
   */
  convert(blockNode: BlockNode, targetModel: BlockModelInterface): boolean {
    const { events } = this.editor;
    const model = blockNode.blockModel,
      curIndex = this.getIndex(blockNode);

    const [beforeBlockNode, beforeTargetModel] = model.beforeConvert(blockNode, targetModel);

    if (model.isConvertible() && beforeTargetModel.isConvertible()) {
      if (!beforeBlockNode)
        return false;

      const targetBlockNode = beforeTargetModel.create() as BlockNode;

      const createItem = (target: HTMLElement, content: string) => {
        const newItem = beforeTargetModel.makeItemNode(content);
        append(target, newItem);
      }

      if (targetBlockNode) {
        const contentNode = this.getContentNode(beforeBlockNode),
          targetContentNode = this.getContentNode(targetBlockNode),
          isEditableItems = model.isEditableItems(),
          isTargetEditableChilds = beforeTargetModel.isEditableItems(),
          sanitizerConfig = beforeTargetModel.getConfig("sanitizerConfig", {}),
          isSanitize = Object.keys(sanitizerConfig).length,
          isRaw = beforeTargetModel.isRaw();

        if (contentNode && targetContentNode) {
          const appendContent = (target: HTMLElement, source: HTMLElement) => {
            if (isRaw || !isSanitize) {
              appendText(target, getText(source));
            } else {
              append(target, getChildNodes(source));
            }
          };

          // Case 1: text -> text (both not editable child)
          if (!isEditableItems && !isTargetEditableChilds) {
            appendContent(targetContentNode, contentNode);
          }

          // Case 2: list/child -> text
          else if (isEditableItems && !isTargetEditableChilds) {
            const items = model.getItems();

            if (items && items.length) {
              items.forEach((item: HTMLElement, index: number) => {
                const itemBodyNode = model.getItemBody(index);
                if (itemBodyNode) {
                  if (index > 0) appendText(targetContentNode, ' ');
                  appendContent(targetContentNode, itemBodyNode);
                }
              });
            } else
              return false;
          }

          // Case 3: text -> list/child
          else if (!isEditableItems && isTargetEditableChilds) {
            html(targetContentNode, '');
            createItem(targetContentNode, html(contentNode));
          }

          // Case 4: list/child -> list/child
          else if (isEditableItems && isTargetEditableChilds) {
            const items = model.getItems(),
              isSingleItem = beforeTargetModel.isSingleItem();

            if (items && items.length) {
              html(targetContentNode, '');
              const childs: Node[] = [];

              items.forEach((_item: HTMLElement, index: number) => {
                const itemBodyNode = model.getItemBody(index);
                if (itemBodyNode) {
                  if (isSingleItem) {
                    getChildNodes(itemBodyNode).forEach((child) => {
                      childs.push(child);
                    });
                  } else
                    createItem(targetContentNode, html(itemBodyNode));
                }
              });

              if (isSingleItem && childs.length) {
                const temp = make(
                  'div',
                  (div: HTMLDivElement) => append(div, childs)
                );
                createItem(targetContentNode, html(temp));
              }
            }
          }
        }

        after(beforeBlockNode, targetBlockNode);

        if (isSanitize) {
          beforeTargetModel.sanitize();
        }

        beforeBlockNode.remove();
        this.focus(curIndex);
      }

      const afterBlockNode = model.afterConvert(targetBlockNode);

      events.change({
        type: "convertBlock",
        index: curIndex,
        blockNode: afterBlockNode
      });

      events.refresh();
    }

    return true;
  }
  /**
   * Gets all registered block models
   * @returns Array of block model structures
   */
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

  /**
   * Gets the real block type from a related type name
   * @param relatedName - Related type name
   * @returns Real block type or null
   */
  getRealType(relatedName: string) {
    let type = null;

    (
      this.getBlockModels()
    ).forEach((model: BlockModelStructure) => {
      if (model.types && model.types.includes(relatedName)) {
        type = model.type;
      }
    });

    return type;
  }

  /**
   * Cleans up event listeners
   */
  destroy() {
    off(document, 'dblclick.unactive');
    this.destroyVirtualSelection();
  }
}