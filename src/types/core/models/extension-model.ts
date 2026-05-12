import type {
  BaseModelConfig,
  BaseModel,
  BaseElement,
  ModelConstructor
} from "@/types";

/**
 * Extension model constructor type
 * Specialized constructor that creates ExtensionModel instances
 * with ExtensionModelConfig
 */
export type ExtensionModelConstructor = ModelConstructor<ExtensionModel, ExtensionModelConfig>;

/**
 * Extension DOM node interface
 * Extends HTMLElement with extension model reference
 */
export interface ExtensionElement extends BaseElement {
  /** Reference to the extension model instance */
  baseModel: ExtensionModel;
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
export interface ExtensionModel extends BaseModel<ExtensionElement> {
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