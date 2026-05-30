import { ToolModel } from './models';

/**
 * Tools manager interface
 * Defines all public methods for toolbar manipulation
 */
export interface Tools {
  /**
   * Show the toolbar at the current selection position
   */
  show(): void;

  /**
   * Hide the toolbar
   */
  hide(): void;

  /**
   * Synchronize active state highlighting for tools based on current selection
   */
  syncHighlight(): void;

  /**
   * Gets all registered tools.
   * @returns Array of tool models.
   */
  getTools(): ToolModel[];

  /**
   * Gets a tool model by its unique string tag, or `null` if not found.
   * @param tagName - unique string identifier of the model.
   * @returns the matching ToolModel or null.
   */
  getModelByTagName(tagName: string): ToolModel | null;

  /**
   * Destroy tools manager and clean up resources
   */
  destroy(): void;
}
