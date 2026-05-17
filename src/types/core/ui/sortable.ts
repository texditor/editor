export interface SortableOptions {
    group?: string;
    swap?: boolean;
    duration?: number;
    easing?: string;
    scale?: number;
    opacity?: number;
    grabTimeout?: number;
    parentDrop?: boolean;
    moveThreshold?: number;
    scrollThreshold?: number;
    edgeThreshold?: number;
    scrollSpeed?: number;
    zIndex?: number;
    selectorParent?: string;
    selectorItems?: string;
    selectorItemsIgnore?: string;
    selectorHandler?: string;
    selectorIgnoreTarget?: string;
    selectorIgnoreFields?: string;
    classGhost?: string;
    classActive?: string;
    classTouch?: string;
    classGrab?: string;
    classTarget?: string;
    classAnimated?: string;
    classAnimatedDrop?: string;
    classInvalid?: string;
    onBeforeGrab?: (data: any) => boolean | void;
    onGrab?: (data: any) => void;
    onMove?: (data: any) => void;
    onBeforeDrop?: (data: any) => boolean | void;
    onDrop?: (data: any) => void;
    onAnimationEnd?: () => void;
}

export interface SortableScrollAnimation {
    start: () => void;
    stop: () => void;
    tick: () => void;
}