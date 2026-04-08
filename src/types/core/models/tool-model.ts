import type { BaseModelConfig, BaseNode, ModelConstructor } from "@/types";
import { BaseModelInterface } from "./base-model";

/**
 * Tool model constructor type
 * Specialized constructor that creates ToolModelInterface instances
 * with ToolModelConfig
 */
export type ToolModelConstructor = ModelConstructor<ToolModelInterface, ToolModelConfig>;

export interface ToolNode extends BaseNode {
  baseModel: ToolModelInterface;
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
export interface ToolModelInterface extends BaseModelInterface {
  /**
   * Get tool tag name
   * @returns Tag name string
   */
  getTagName(): string;

  /**
   * Apply format to selected content
   * @param onlyRemove - If true, only remove format; if false, toggle format
   * @returns void
   */
  format(onlyRemove?: boolean): void;

  /**
   * Force create format on selected content (without toggling)
   * @returns void
   */
  forcedFormat(): void;

  /**
   * Remove format from selected content
   * @returns void
   */
  removeFormat(): void;

  /**
 * Clear and separate tags outside the formatting area
   * @returns boolean
 */
  isSeparate(): boolean

  /**
   * Protected methods for understanding the tool model structure
   * Hooks
   * protected onFormat(tags: HTMLElement[]): void;
   */
}