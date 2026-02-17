export interface CommandsInterface {
    // Formatting methods
    formatTextRange(tagName: string, startOffset: number, endOffset: number, container: HTMLElement): void;
    format(tagName: string, focus?: boolean): void;
    createFormat(tagName: string): void;
    removeFormat(tagName: string, focus?: boolean, normalize?: boolean): void;
    clearAllFormatting(normalize?: boolean): void;

    // Normalization methods
    normalize(container?: HTMLElement): void;
    flattenNestedSimilarTags(parentElement: HTMLElement): void;
    mergeAdjacentTags(root: HTMLElement | Element): void;
    removeEmptyTags(element: HTMLElement, tagName: string): void;

    // Element manipulation methods
    splitElement(
        element: HTMLElement,
        startIndex: number,
        endIndex: number
    ): [HTMLElement, DocumentFragment, HTMLElement];
    replaceEmptyEdges(el: HTMLElement, item?: HTMLElement | Node): void;

    // Selection and tag detection methods
    findTags(tagName?: string | boolean, childrens?: boolean): HTMLElement[];
    getSelectionDirection(tagName: string | HTMLElement): string | null;

    // Utility methods
    getEdgeChars(str: string): {
        firstChar: string;
        lastChar: string;
        isEmptyFirstChar: boolean;
        isEmptyLastChar: boolean;
    };
}