import type { BaseModelConfig, BaseModel, BaseElement, BlockElement, FileItemElement, ModelConstructor } from '@/types';

/**
 * Block model constructor type
 * Specialized constructor that creates FileActionModel instances with FileActionModelConfig
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
 *@property actions - List of file action constructors
 */
export interface FileActionModelConfig extends BaseModelConfig {
  actions: FileActionModelConstructor[];
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
