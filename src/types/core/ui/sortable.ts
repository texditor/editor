/**
 * Type representing a Sortable container
 * Can be either an existing HTMLElement or a CSS selector string to find the container
 */
export type SortableContainer = HTMLElement | string;

/**
 * Type representing a drag handle selector
 * - HTMLElement: Direct reference to the handle element
 * - string: CSS selector to find the handle within the sortable item
 * - null: No specific handle, the entire item acts as the handle
 */
export type SortableHandleSelector = HTMLElement | string | null;

/**
 * Configuration options for Sortable instance
 */
export interface SortableOptions {
    /**
     * Element or selector for drag handles
     * If null, the entire item becomes the handle
     */
    handleSelector?: SortableHandleSelector;

    /**
     * CSS selector for sortable items within the container
     * @default "li"
     */
    itemSelector?: string;
    

    threshold?: number;

    /**
     * Callback fired when dragging starts
     * @param item - The HTMLElement being dragged
     * @param index - Original index of the item
     */
    onStart?: (item: HTMLElement, index: number) => void;

    /**
     * Callback fired when item is moved during drag
     * @param item - The HTMLElement being dragged
     * @param fromIndex - Original index where drag started
     * @param toIndex - Current target index during drag
     */
    onMove?: (item: HTMLElement, fromIndex: number, toIndex: number) => void;

    /**
     * Callback fired when dragging ends
     * @param item - The HTMLElement that was dragged
     * @param oldIndex - Original index before drag
     * @param newIndex - New index after drop
     */
    onEnd?: (item: HTMLElement, oldIndex: number, newIndex: number) => void;

    /**
     * Allow for additional custom options
     */
    [key: string]: unknown;
}

export interface SortableInerface {
    /**
     * Updates the sortable instance
     * Should be called when new items are dynamically added to the container
     * Initializes any new items that aren't already sortable
     */
    update(): void;

    /**
     * Destroys the sortable instance
     * Removes all event listeners and sortable-related classes
     * Cleans up all resources used by this instance
     */
    destroy(): void;
}