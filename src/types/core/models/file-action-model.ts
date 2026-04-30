import type {
  BaseModelConfig,
  BaseModelInterface,
  BaseNode,
  FileItemNode,
  ModelConstructor
} from "@/types";

/**
 * Block model constructor type
 * Specialized constructor that creates ActionModelInterface instances
 * with ActionModelConfig
 */
export type FileActionModelConstructor = ModelConstructor<FileActionModelInterface, FileActionModelConfig>;

/**
 * File action DOM node interface
 * Extends HTMLElement with action model reference
 */
export interface FileActionNode extends BaseNode {
  /** Reference to the action model instance */
  baseModel: FileActionModelInterface;
}

/**
 * File action model configuration interface
 * @property menu - Whether action shows a menu on click
 * @property confirm - Whether action requires confirmation before execution
 */
export interface FileActionModelConfig extends BaseModelConfig {
  actions: FileActionModelInterface[]
}

export interface FileActionModelInterface extends BaseModelInterface<FileActionNode> {
  setItemNode(itemNode: FileItemNode): void
  getItemNode(): FileItemNode | null;
}
