import type {
  BaseModelConfig,
  BaseModelInterface,
  BaseNode,
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
export interface ActionNode extends BaseNode {
  /** Reference to the action model instance */
  baseModel: ActionModelInterface;
}


/**
 * Action model configuration interface
 * @property menu - Whether action shows a menu on click
 * @property confirm - Whether action requires confirmation before execution
 */
export interface ActionModelConfig extends BaseModelConfig {
  menu: boolean;
  confirm: boolean;
}

/**
 * Action model behavior interface
 * Defines all public methods for action manipulation
 */
export interface ActionModelInterface extends BaseModelInterface {
  /**
   * Check if action shows a menu on click
   * @returns True if action has a menu, false otherwise
   */
  isMenu(): boolean;

  /**
   * Check if action requires confirmation before execution
   * @returns True if confirmation is required, false otherwise
   */
  isConfirm(): boolean;

  /**
   * Menu configuration
   * @returns Menu configuration object with title and items
   */
  menuConfig(): {
    title: string;
    items: [] | HTMLElement[];
    onCreate?: CallableFunction;
  };
}