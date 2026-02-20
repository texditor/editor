import { HTMLBlockElement } from "../core";

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
  blockElement: HTMLBlockElement;
  blockContent?: HTMLElement;
  options?: FilesCreateOptions;
}

export interface FilesListCreateParams {
  items: FileItem[],
  blockElement: HTMLBlockElement | null,
  contentElement: HTMLElement | null,
  options: FilesCreateOptions
}