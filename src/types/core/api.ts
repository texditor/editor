import type { BlockSchema } from "..";
export interface APIInterface {
  /**
   * Retrieves the root element of the editor
   * @returns The root HTMLElement or null if not set
   * @throws Error if root element is not found
   */
  getRoot(): HTMLElement | null;

  /**
   * Completely destroys the editor instance
   * Cleans up all event listeners, removes DOM elements,
   * and destroys all sub-components (actions, blocks, tools, etc.)
   */
  destroy(): void;

  /**
   * Checks if the editor has any content
   * @returns True if the editor is empty, false otherwise
   */
  isEmpty(): boolean;

  /**
   * Sets the editor content
   * @param content - JSON string or array of block schemas
   * @param index - Optional block index to set as active
   * @param focusDelay - Focus delay
   */
  setContent(content: string | BlockSchema[], index?: number, focusDelay?: number): void;

  /**
   * Gets the current editor content as serialized block data
   * @returns Array of block output objects representing current content
   */
  getContent(): BlockSchema[];

  /**
   * Saves the current editor state to a serializable format
   * Triggers 'save', 'saveEach', 'saveEachEnd', and 'saveEnd' events
   * @returns Array of block output objects ready for storage or transmission
   */
  save(): BlockSchema[];
}