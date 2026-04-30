import { FilesBlockModelConfig, FilesBlockModelInterface } from "./files";

export interface GalleryBlockModelConfig extends FilesBlockModelConfig {
    styles: string[];
    stylesLtr: 'left' | 'right';
    defaultStyle: string;
    sliderInfinite: boolean;
    imageMimeTypes: string[];
    videoMimeTypes: string[];
}

export interface GalleryBlockModelInterface extends FilesBlockModelInterface {
    getStyles(): string[];
    areStylesAllowed(): boolean;
}