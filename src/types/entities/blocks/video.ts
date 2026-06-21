import { FileBlockModelConfig, FileBlockModel } from './file';

/**
 * Configuration interface for the Video block model.
 * @property styles - Available display styles for the image
 * @property stylesLtr - Position of the style selector panel ('left' or 'right')
 * @property defaultStyle - Default display style when no style is selected
 * @property sliderInfinite - Whether the slider should loop infinitely
 * @property imageMimeTypes - MIME types that should be rendered as images
 * @property videoMimeTypes - MIME types that should be rendered as videos
 */
export interface VideoBlockModelConfig extends FileBlockModelConfig {

}

/**
 * Interface for the Video block model.
 * Provides methods for managing image-specific display styles and behavior.
 */
export interface VideoBlockModel extends FileBlockModel {

}