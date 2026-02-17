export interface RenderIconOptions {
  width?: number;
  height?: number;
  classes?: string;
}

export interface RenderIconObject {
  raw?: string;
}

export type RenderIconContent = string | RenderIconObject;
