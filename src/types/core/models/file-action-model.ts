import type {
  BaseModelConfig,
  BaseModel,
  BaseElement,
  BlockElement,
  FileItemElement,
  ModelConstructor
} from "@/types";

/**
 * Block model constructor type
 * Specialized constructor that creates ActionModel instances
 * with ActionModelConfig
 */
export type FileActionModelConstructor = ModelConstructor<FileActionModel, FileActionModelConfig>;

/**
 * File action DOM node interface
 * Extends HTMLElement with action model reference
 */
export interface FileActionElement extends BaseElement {
  /** Reference to the action model instance */
  baseModel: FileActionModel;
}

/**
 * File action model configuration interface
 * @property menu - Whether action shows a menu on click
 * @property confirm - Whether action requires confirmation before execution
 */
export interface FileActionModelConfig extends BaseModelConfig {
  actions: FileActionModel[]
}

export interface FileActionModel extends BaseModel<FileActionElement> {
  /**
   * Returns the parent block node associated with this action.
   * @returns The parent block node or null if not set.
   */
  getBlockElement(): BlockElement | null;

  /**
   * Returns the file item element.
   * @returns The file item element or null if not set.
   */
  getItemElement(): FileItemElement | null;
}