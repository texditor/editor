import { FileBlockModelConfig, FileBlockModel, FileItem } from './file';

/**
 * Configuration interface for the Image block model.
 * @property styles - Available display styles for the image
 * @property stylesLtr - Position of the style selector panel ('left' or 'right')
 * @property defaultStyle - Default display style when no style is selected
 * @property sliderInfinite - Whether the slider should loop infinitely
 * @property imageMimeTypes - MIME types that should be rendered as images
 * @property videoMimeTypes - MIME types that should be rendered as videos
 */
export interface ImageBlockModelConfig extends FileBlockModelConfig {
  styles: string[];
  stylesLtr: 'left' | 'right';
  defaultStyle: string;
  sliderInfinite: boolean;
}

export interface VideoSize {
  id?: number;
  url?: string;
}

export interface VideoItem extends Omit<FileItem, 'url' | 'type'> {
  url?: string;
  type?: string;
  poster?: string;
  [key: string]: unknown;
}

/**
 * Interface for the Image block model.
 * Provides methods for managing image-specific display styles and behavior.
 */
export interface ImageBlockModel extends FileBlockModel {
  /**
   * Returns the list of available display styles for the image
   * @returns Array of style identifiers
   */
  getStyles(): string[];

  /**
   * Returns the default display style for the image
   * @returns Default style identifier
   */
  getDefaultStyle(): string;

  /**
   * Checks if all configured styles are valid and allowed
   * @returns True if all styles are valid, false otherwise
   */
  areStylesAllowed(): boolean;
}