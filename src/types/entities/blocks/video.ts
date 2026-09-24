import { FileItem } from './file';

/** Video item: FileItem with optional url/type plus poster. */
export interface VideoItem extends Omit<FileItem, 'url' | 'type'> {
  url?: string;
  type?: string;
  poster?: string;
  [key: string]: unknown;
}
