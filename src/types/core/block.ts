import { BlockModelInterface } from "./models";

export interface BlockNode extends HTMLElement {
  blockModel: BlockModelInterface;
  value: string;
}

export type BlockOutputData = string[] | object[];

export interface BlockOutput {
  data: BlockOutputData | [];
  type: string;
  attr?: Record<string, string | undefined>;
  [key: string]: unknown;
}

export interface BlockCreateOptions {
  content?: string;
  [key: string]: unknown;
}
