import type { ActionModelInterface, BlockNode } from ".";

/**
 * Defines the public API for managing actions in the Texditor editor.
 * Actions include operations like create, convert, move, and delete on content blocks.
 */
export interface ActionsInterface {
  /**
   * Creates and renders action buttons for a specific block node
   * @param blockNode - The block node to attach actions to
   */
  create(blockNode: BlockNode): void;

  /**
   * Displays a custom menu with specified items
   * @param items - Array of HTML elements to display in the menu
   * @param title - Optional title for the menu
   */
  showMenu(items: HTMLElement[], title?: string): void;

  /**
   * Hides the currently displayed menu
   */
  hideMenu(): void;

  /**
   * Displays the actions panel for the current block
   */
  show(): void;

  /**
   * Hides the actions panel
   */
  hide(): void;

  /**
   * Retrieves all available action models
   * @returns Array of action model instances
   */
  getActions(): ActionModelInterface[];

  /**
   * Removes all action elements from the current block
   */
  removeActionElements(): void;

  /**
   * Cleans up all action elements and event listeners
   */
  destroy(): void;
}