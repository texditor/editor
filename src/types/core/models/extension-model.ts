import type {
  BaseModelConfig,
  BaseModelInterface,
  BaseNode,
  ModelConstructor
} from "@/types";

/**
 * Extension model constructor type
 * Specialized constructor that creates ExtensionModelInterface instances
 * with ExtensionModelConfig
 */
export type ExtensionModelConstructor = ModelConstructor<ExtensionModelInterface, ExtensionModelConfig>;

/**
 * Extension DOM node interface
 * Extends HTMLElement with extension model reference
 */
export interface ExtensionNode extends BaseNode {
  /** Reference to the extension model instance */
  baseModel: ExtensionModelInterface;
}

/**
 * Extension model configuration interface
 * @property toggleActive - Whether extension toggles active state on click
 * @property groupName - Group name for categorization
 */
export interface ExtensionModelConfig extends BaseModelConfig {
  toggleActive: boolean;
  groupName: string;
}

/**
 * Extension model behavior interface
 * Defines all public methods for extension manipulation
 */
export interface ExtensionModelInterface extends BaseModelInterface<ExtensionNode> {
  /**
   * Get group name for categorization
   * @returns Group name string
   */
  getGroupName(): string;

  /**
   * Check if extension toggles active state on click
   * @returns True if toggle active is enabled
   */
  isToggleActive(): boolean;
}