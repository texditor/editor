import type { BlockOutput } from "..";
export interface APIInterface {
  /**
   * Sets the root HTML element where the editor will be mounted
   * @param el - HTML element to use as the editor container
   */
  setRoot(el: HTMLElement): void;

  /**
   * Retrieves the root element of the editor
   * @returns The root HTMLElement or false if not set
   * @throws Error if root element is not found
   */
  getRoot(): HTMLElement | false;

  /**
   * Gets the unique identifier
   * @returns Unique ID string used for event namespacing
   */
  getUniqueId(): string;

  /**
   * Renders the editor interface in the DOM
   * Initializes all blocks and sets up the editor structure
   * @throws Error if the editor container element is not found
   */
  render(): void;

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
   * @param content - A JSON string or an array of block output data
   * @param index - Optional block index to set as active
   * @param focusDelay - Focus delay
   */
  setContent(content: string | BlockOutput[], index?: number, focusDelay?: number): void;

  /**
   * Gets the current editor content as serialized block data
   * @returns Array of block output objects representing current content
   */
  getContent(): BlockOutput[];

  /**
   * Saves the current editor state to a serializable format
   * Triggers 'save', 'saveEach', 'saveEachEnd', and 'saveEnd' events
   * @returns Array of block output objects ready for storage or transmission
   */
  save(): BlockOutput[];
}