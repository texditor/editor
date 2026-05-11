import type { BlockChildSchema, BlockCreateSchema, BlockModelInterface, BlockModelSchema, BlockNode, BlockSchema } from ".";
import { VirtualSelectionInterface } from "./ui/virtual-selection";

export interface BlockManagerInterface {
  /**
   * Creates or recreates the VirtualSelection instance with current options
   * If an instance already exists, it will be destroyed first
   * @returns {VirtualSelectionInterface | null}
   */
  refreshVirtualSelection(): VirtualSelectionInterface | null;

  /**
   * Returns the current VirtualSelection instance if it exists
   * @returns {VirtualSelectionInterface | null} 
   */
  getVirtualSelection(): VirtualSelectionInterface | null;

  /**
  * Clear Selection UI
   * @returns {void}
  */
  clearVirtualSelection(): void

  /**
   * Destroys the current VirtualSelection instance if it exists
   * Removes all event listeners and performs cleanup
   * @returns {void}
   */
  destroyVirtualSelection(): void;

  /**
   * Gets the container element that holds all blocks
   * @returns The blocks container element or null if not found
   */
  getBlocksContainer(): HTMLElement | null;

  /**
   * Gets all block nodes in the editor
   * @returns Array of block nodes
   */
  getBlockNodes(): BlockNode[];

  /**
   * Gets a specific block node by index
   * @param index - Block index (defaults to current index)
   * @returns Block node or null if not found
   */
  getElement(index?: number): BlockNode | null;

  /**
   * Gets the content node within a block
   * @param blockNode - Block node (defaults to current block)
   * @returns Content element or null
   */
  getContentNode(blockNode?: BlockNode): HTMLElement | null;

  /**
   * Gets the next block node after current active block
   * @returns Next block node or null
   */
  getNextBlockNode(): BlockNode | null;

  /**
   * Gets the previous block node before current active block
   * @returns Previous block node or null
   */
  getPrevBlockNode(): BlockNode | null;

  /**
   * Finds parent block of a target element
   * @param targetNode - Target element or event target
   * @returns Parent block node or null
   */
  findParent(targetNode: EventTarget | BlockNode | HTMLElement): BlockNode | null;

  /**
   * Gets the index of a block
   * @param node - Target node (defaults to current block)
   * @returns Block index
   */
  getIndex(node?: BlockNode | HTMLElement | EventTarget): number;

  /**
   * Sets the active block index and updates UI
   * @param index - Block index to set as active
   */
  use(index: number): void;

  /**
   * Gets the total number of blocks
   * @returns Block count
   */
  count(): number;

  /**
   * Checks if a block is empty
   * @param index - Block index (defaults to current block)
   * @returns True if block is empty
   */
  isEmpty(index?: number): boolean;

  /**
   * Gets the block model for a specific block
   * @param index - Block index (defaults to current block)
   * @returns Block model or null
   */
  getModel(index?: number): BlockModelInterface | null;

  /**
   * Sets focus to a specific block by index
   * @param index - Block index to focus
   * @param startPos - Starting the selection position
   * @param endPos - End of selection position
   * @param itemIndex - Item index
   * @returns The focused block node or null if focus failed
   */
  focus(index: number, startPos?: number, endPos?: number, itemIndex?: number): BlockNode | null;

  /**
   * Creates a default block based on editor configuration
    * @param index - Index of the block to create (-1 after the current block)
    * @param options - Block Options
    * @returns Created block node or null
   */
  createDefaultBlock(index?: number, options?: BlockCreateSchema): BlockNode | null;

  /**
   * Creates a new block of specified type
   * @param name - Block type name
   * @param index - Index of the block to create (-1 after the current block)
   * @param options - Block Options
   * @param skipEvents - If true, no events will be emitted and focus won't be automatically managed
   * @returns Created block node or null
   */
  createBlock(name: string, index?: number, options?: BlockCreateSchema, skipEvents?: boolean): BlockNode | null;

  /**
 * Move block to new position
 * @param index - Item index
 * @param targetIndex - Target item index 
 * @param skipEvents - Skip events
 */
  moveBlock(index: number, targetIndex: number, skipEvents?: boolean): void

  /**
   * Removes one or multiple blocks
   * @param index - Index of the block to delete (-1 to the current block)
   * @param skipEvents - If true, no events will be emitted and focus won't be automatically managed
   * @returns Index of last removed block or null
   */
  removeBlock(index?: number | number[], skipEvents?: boolean): number | null;

  /**
   * Merges two blocks together
   * @param index - Block index
   * @param targetIndex - Target block index
   * @param focus - The index of the focus block
   * @param useItems - Use all the contents of the editable child elements.
   */
  merge(index: number, targetIndex: number, focus?: number, useItems?: boolean | false): void;

  /**
   * Converts a block to a different type
   * @param block - Block to convert
   * @param targetModel - Target block model
   * @returns Convert status
   */
  convert(block: BlockNode, targetModel: BlockModelInterface): boolean;

  /**
   * Updates empty state data attributes on blocks
   * @param emptyAttr - Whether to set empty attribute
   */
  detectEmpty(emptyAttr?: boolean): void;

  /**
   * Normalizes all blocks that require normalization
   */
  normalize(): void;

  /**
 * Retrieves a list of block models based on nodes
 * @returns List of block models
 */
  getModels(): BlockModelInterface[];

  /**
   * Gets all registered block models
   * @returns Array of block model structures
   */
  getSchemas(): BlockModelSchema[];

  /**
 * Gets the block model schema by supported type name
 * @param name - Supported type name or alias
 * @returns Block model schema, or null if not found
 */
  getSchema(name: string): BlockModelSchema | null

  /**
   * Gets the real block type name from a related type alias
   * @param name - Supported type name or alias
   * @returns Real block type name, or null if not found
   */
  getRealName(name: string): string | null;

  /**
   * Converts HTML string to an array of BlockSchema objects or text strings.
   * 
   * @param html - HTML string to parse
   * @returns Array of BlockSchema for elements or strings for text nodes
   */
  htmlToData(html: string): Array<BlockSchema | string>;

  /**
   * Parses a block schema into a BlockNode instance
   * @param blockSchema - Block schema object containing type and data
   * @param skipDecode - Whether to skip decoding of child content (default: false)
   * @returns Parsed BlockNode instance, or null if parsing failed
   */
  parseBlock(blockSchema: BlockSchema, skipDecode?: boolean): BlockNode | null

  /**
  * Converts an array of BlockSchema objects into an array of BlockNode objects.
  * 
  * @param data - Array of BlockSchema objects to be parsed
  * @param skipDecode - If true, skips HTML entity decoding for text content
  * @returns An array of parsed BlockNode objects
  */
  parseBlocks(data: BlockSchema[], skipDecode?: boolean): BlockNode[];

  /**
   * Recursively parses a BlockSchema structure and converts it into an array of DOM Nodes.
   * For root call returns children nodes, for recursive calls returns the element itself.
   * 
   * @param schema - The BlockSchema or BlockChildSchema object containing type, data, and optional attributes
   * @param skipDecode - If true, skips HTML entity decoding for text content
   * @param returnElement - Internal parameter to track if this is a recursive call
   * @returns An array of DOM Nodes
   */
  parseChilds(schema: BlockSchema | BlockChildSchema, skipDecode?: boolean, returnElement?: boolean): Node[];

  /**
   * Cleans up event listeners
   */
  destroy(): void;
}