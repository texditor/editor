/**
 * Configuration options for the VirtualSelection manager
 */
export interface VirtualSelectionOptions {
    /**
     * Container element that holds the selectable blocks
     */
    blocksContainer: HTMLElement;

    /**
     * CSS selector to identify selectable blocks within the container
     */
    blockSelector: string;

    /**
     * Zone where selection interaction is active
     * @default document.body
     */
    selectionZone?: HTMLElement;

    /**
     * CSS class name applied to selected blocks
     * @default 'tex-ui-vs-selected'
     */
    selectedBlockClass?: string;

    /**
     * Tolerance margin (in pixels) when checking if pointer has exited a block's bounds
     * @default 8
     */
    exitTolerance?: number;

    /**
     * Auto-scroll speed (in pixels per frame) when dragging near viewport edges
     * @default 30
     */
    autoScrollSpeed?: number;

    /**
     * Distance (in pixels) from viewport edge to trigger auto-scroll
     * @default 50
     */
    autoScrollEdgeThreshold?: number;

    /**
     * Delayed launch of the touch version.
     * @default 200
     */
    touchActivationDelay: number

    /**
     * Callback invoked when the set of selected blocks changes
     * @param selectedIndices - Array of indices of selected blocks
     * @param selectedElements - Array of DOM elements of selected blocks
     */
    onSelectionChange?: (selectedIndices: number[], selectedElements: HTMLElement[]) => void;

    /**
     * Callback invoked when lasso selection mode starts
     */
    onLassoStart?: () => void;

    /**
     * Callback invoked when lasso selection mode ends
     */
    onLassoEnd?: () => void;
}

export interface VirtualSelectionInterface {
    /**
     * Returns array of indices of currently selected blocks.
     * @returns {number[]} Array of selected block indices
     */
    getSelectedIndices(): number[]

    /**
     * Returns array of DOM elements that are currently selected
     * @returns {HTMLElement[]} Array of selected block elements
     */
    getSelectedBlocks(): HTMLElement[];

    /**
     * Clears current selection, removes all selected blocks
     * @returns {void}
     */
    clearSelection(): void;

    /**
     * Refreshes internal blocks cache by querying DOM for current blocks
     * Updates indices and reapplies selection state
     * @returns {void}
     */
    refreshBlocks(): void;

    /**
     * Destroys the VirtualSelection instance
     * Removes all event listeners, DOM elements, and observers
     * Performs cleanup to prevent memory leaks
     * @returns {void}
     */
    destroy(): void;
}