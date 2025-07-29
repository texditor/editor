export interface FileItem {
  url: string;
  type: string;
  caption?: string;
  desc?: string;
  sizes?: Record<string, string> | string;
  [key: string]: unknown;
}
