export interface FileItem {
  url: string;
  type: string;
  thumbnail?: string;
  caption?: string;
  desc?: string;
  size?: number;
  id?: number;
  [key: string]: unknown;
}
