import type {
  BaseModelConfig,
  BaseModelInterface,
  BaseElement,
  BlockElement,
  ModelConstructor
} from "@/types";

/**
 * Action model constructor type
 * Specialized constructor that creates ActionModelInterface instances
 * with ActionModelConfig
 */
export type ActionModelConstructor = ModelConstructor<ActionModelInterface, ActionModelConfig>;

/**
 * Action DOM node interface
 * Extends HTMLElement with action model reference
 */
export interface ActionElement extends BaseElement {
  /** Reference to the action model instance */
  baseModel: ActionModelInterface;
}

/**
 * Action model configuration interface
 * @property menu - Whether action shows a menu on click
 * @property confirm - Whether action requires confirmation before execution
 */
export interface ActionModelConfig extends BaseModelConfig {
  dropdown: boolean;
  confirm: boolean;
}

/**
 * Action model behavior interface
 * Defines all public methods for action manipulation
 */
export interface ActionModelInterface extends BaseModelInterface<ActionElement> {
  /**
   * Get the parent block node associated with this action
   * @returns The parent block node or null if not set
   */
  getBlockElement(): BlockElement | null;

  /**
   * Check if the drop-down list of actions is displayed when you click
   * @returns True if the action has a dropdown menu, false otherwise.
   */
  isDropdown(): boolean;

  /**
   * Check if action requires confirmation before execution
   * @returns True if confirmation is required, false otherwise
   */
  isConfirm(): boolean;
}