import { FilesBlockModelConfig, FilesBlockModel } from "./files";

export interface GalleryBlockModelConfig extends FilesBlockModelConfig {
    styles: string[];
    stylesLtr: 'left' | 'right';
    defaultStyle: string;
    sliderInfinite: boolean;
    imageMimeTypes: string[];
    videoMimeTypes: string[];
}

export interface GalleryBlockModel extends FilesBlockModel {
    getStyles(): string[];
    areStylesAllowed(): boolean;
}