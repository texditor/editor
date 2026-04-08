import { ToolModelInterface } from "./models";

/**
 * Tools manager interface
 * Defines all public methods for toolbar manipulation
 */
export interface ToolsInterface {
  /**
   * Show the toolbar at the current selection position
   * @returns void
   */
  show(): void;

  /**
   * Hide the toolbar
   * @returns void
   */
  hide(): void;

  /**
   * Synchronize active state highlighting for tools based on current selection
   * @returns void
   */
  syncHighlight(): void;

  /**
   * Get all registered tools
   * @returns Array of tool models
   */
  getTools(): ToolModelInterface[];

  /**
   * Destroy tools manager and clean up resources
   * @returns void
   */
  destroy(): void;
}