import { FilesBlockModelConfig, FilesBlockModel } from "./files";

/**
 * Configuration interface for the Gallery block model.
 * @property styles - Available display styles for the gallery
 * @property stylesLtr - Position of the style selector panel ('left' or 'right')
 * @property defaultStyle - Default display style when no style is selected
 * @property sliderInfinite - Whether the slider should loop infinitely
 * @property imageMimeTypes - MIME types that should be rendered as images
 * @property videoMimeTypes - MIME types that should be rendered as videos
 */
export interface GalleryBlockModelConfig extends FilesBlockModelConfig {
    styles: string[];
    stylesLtr: 'left' | 'right';
    defaultStyle: string;
    sliderInfinite: boolean;
    imageMimeTypes: string[];
    videoMimeTypes: string[];
}

/**
 * Interface for the Gallery block model.
 * Provides methods for managing gallery-specific display styles and behavior.
 */
export interface GalleryBlockModel extends FilesBlockModel {
    /**
     * Returns the list of available display styles for the gallery
     * @returns Array of style identifiers
     */
    getStyles(): string[];

    /**
     * Returns the default display style for the gallery
     * @returns Default style identifier
     */
    getDefaultStyle(): string;

    /**
     * Checks if all configured styles are valid and allowed
     * @returns True if all styles are valid, false otherwise
     */
    areStylesAllowed(): boolean;
}