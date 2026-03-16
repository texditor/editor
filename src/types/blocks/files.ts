import { BlockNode } from "../core";

export interface FileItem {
  url: string;
  type: string;
  thumbnail?: string;
  caption?: string;
  desc?: string;
  name?: string;
  size?: number;
  id?: number;
  [key: string]: unknown;
}

export interface FilesCreateOptions {
  [key: string]: unknown;
}

export interface FilesFormCreateParams {
  el: HTMLElement;
  blockNode: BlockNode;
  contentNode?: HTMLElement;
  options?: FilesCreateOptions;
}

export interface FilesListCreateParams {
  items: FileItem[],
  blockNode: BlockNode | null,
  contentElement: HTMLElement | null,
  options: FilesCreateOptions
}