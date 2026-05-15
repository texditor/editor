import type { BaseModelConfig, BaseElement, ModelConstructor, BlockElement } from "@/types";
import { BaseModel } from "../base/base-model";

/**
 * Tool model constructor type
 * Specialized constructor that creates ToolModel instances
 * with ToolModelConfig
 */
export type ToolModelConstructor = ModelConstructor<ToolModel, ToolModelConfig>;

export interface ToolElement extends BaseElement {
  baseModel: ToolModel;
}

/**
 * Tool model configuration interface
 * @property tagName - Tool HTML tag name for formatting
 * @property override - Overriding tag
 */
export interface ToolModelConfig extends BaseModelConfig {
  tagName: string;
  override: boolean;
}

/**
 * Tool model behavior interface
 * Defines all public methods for tool manipulation
 */
export interface ToolModel extends BaseModel<ToolElement> {
  /**
   * Get tool tag name
   * @returns Tag name string
   */
  getTagName(): string;

  /**
   * Get the parent block node associated with this action
   * @returns The parent block node or null if not set
   */
  getBlockElement(): BlockElement | null;

  /**
   * Apply format to selected content
   */
  format(onlyRemove?: boolean): void;

  /**
   * Force create format on selected content (without toggling) 
   */
  forcedFormat(): void;

  /**
   * Remove format from selected content 
   */
  removeFormat(): void;

  /**
   * Overriding tag
   * @returns boolean
 */
  isOverride(): boolean
}