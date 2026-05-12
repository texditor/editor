import type { BaseModelConfig, BaseElement, ModelConstructor } from "@/types";
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
 */
export interface ToolModelConfig extends BaseModelConfig {
  /** HTML tag name used for formatting */
  tagName: string;
  /** Clear and separate tags outside the formatting area */
  separate: boolean;
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
   * Apply format to selected content
   * @param onlyRemove - If true, only remove format; if false, toggle format 
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
 * Clear and separate tags outside the formatting area
   * @returns boolean
 */
  isSeparate(): boolean
}