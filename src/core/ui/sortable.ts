import '@/styles/core/ui/sortable.css';
import { SortableContainer, SortableInerface, SortableOptions } from '@/types';
import {
    addClass,
    css,
    make,
    queryList,
    on,
    off,
    generateRandomString,
    removeClass,
    rebind
} from '@/utils';

/**
 * Sortable class - Enables drag-and-drop reordering of items within a container
 * Supports both mouse and touch events with customizable handles
 */
export default class Sortable implements SortableInerface {
    private container: HTMLElement;           // The container element that holds sortable items
    private options: SortableOptions;          // Configuration options for the sortable behavior
    private draggedItem: HTMLElement | null = null;  // Currently being dragged element
    private startY: number = 0;                 // Initial Y coordinate of drag start
    private startTop: number = 0;                // Initial top position of dragged item
    private placeholder: HTMLElement;            // Placeholder element shown during drag
    private oldIndex: number = -1;                // Original index of dragged item
    private eid: string;                          // Unique event identifier for this instance
    private containerRect: DOMRect | null = null; // Container's bounding rectangle at drag start
    private itemRect: DOMRect | null = null;      // Dragged item's bounding rectangle at drag start

    /**
     * Creates a new Sortable instance
     * @param container - Container element or CSS selector
     * @param options - Configuration options for sorting behavior
     */
    constructor(
        container: SortableContainer,
        options: SortableOptions = {},
    ) {
        // Resolve container from selector string or use direct element reference
        this.container = typeof container === 'string'
            ? document.querySelector(container)!
            : container;

        // Add base sortable class to container
        addClass(this.container, 'tex-sortable');

        // Merge default options with user-provided options
        this.options = Object.assign({
            handleSelector: null,   // Optional selector for drag handles
            itemSelector: "li"      // Selector for sortable items
        }, options);

        // Generate unique ID for event namespacing
        this.eid = generateRandomString(24);
        // Create placeholder element for visual feedback during drag
        this.placeholder = this.createPlaceholder();
        // Initialize all sortable items
        this.init();
    }

    /**
     * Safely retrieves an option value
     * @param key - Option key to retrieve
     * @returns Option value or null if not found
     */
    private getOption(key: string) {
        return this.options[key] ?? null;
    }

    /**
     * Gets all sortable items within the container
     * @returns Array of HTMLElements matching the item selector
     */
    private getItems(): HTMLElement[] {
        return queryList(
            this.getOption('itemSelector') as string,
            this.container
        );
    }

    /**
     * Gets all visible items (excluding the dragged item) for calculations
     * @returns Array of HTMLElements excluding the currently dragged item
     */
    private getVisibleItems(): HTMLElement[] {
        return this.getItems().filter(item => item !== this.draggedItem);
    }

    /**
     * Creates the placeholder element for visual feedback during dragging
     * @returns Placeholder HTMLElement
     */
    private createPlaceholder(): HTMLElement {
        return make('div', (el: HTMLDivElement) => {
            addClass(el, 'tex-sortable-placeholder');
        });
    }

    /**
     * Gets the actual handle element for an item based on configuration
     * @param item - The sortable item
     * @returns The element that should serve as the drag handle
     */
    private getHandleElement(item: HTMLElement): HTMLElement {
        // If no handle selector specified, the item itself is the handle
        if (!this.options.handleSelector) {
            return item;
        }

        // If selector is a string, find the handle element within the item
        if (typeof this.options.handleSelector === 'string') {
            const [handle] = queryList(this.options.handleSelector, item);

            if (!handle) {
                console.warn(`Handle element "${this.options.handleSelector}" not found, using item itself`);
                return item;
            }

            return handle;
        }

        // Handle selector is already an element
        return this.options.handleSelector;
    }

    /**
     * Gets the current index of an item within the container
     * @param item - Item to find index for
     * @returns Index of the item or -1 if not found (0-based index)
     */
    private getItemIndex(item: HTMLElement): number {
        return this.getItems().indexOf(item);
    }

    /**
     * Gets the target index where the dragged item would be placed
     * Based on the current position of the placeholder
     * @returns 0-based index for the target position
     */
    private getTargetIndex(): number {
        if (!this.draggedItem) return -1;

        // Get all children of the container
        const allChildren = Array.from(this.container.children);

        // Find position of placeholder among all children
        const placeholderPosition = allChildren.indexOf(this.placeholder);

        if (placeholderPosition === -1) return -1;

        // Get all visible items (excluding dragged item)
        const visibleItems = this.getVisibleItems();

        // Count how many visible items come before the placeholder
        let visibleItemsBeforePlaceholder = 0;
        for (let i = 0; i < placeholderPosition; i++) {
            if (visibleItems.includes(allChildren[i] as HTMLElement)) {
                visibleItemsBeforePlaceholder++;
            }
        }

        return visibleItemsBeforePlaceholder;
    }

    /**
     * Initializes all sortable items in the container
     */
    private init(): void {
        const items = this.getItems();

        items.forEach(item => {
            this.initItem(item);
        });
    }

    /**
     * Initializes a single sortable item with necessary classes and event listeners
     * @param item - Item to initialize
     */
    private initItem(item: HTMLElement): void {
        addClass(item, 'tex-sortable-item');

        const handle = this.getHandleElement(item);
        addClass(handle, 'tex-sortable-handle');

        // Add drag start event listeners for mouse and touch
        rebind(handle, `mousedown.sortable-${this.eid}`, (e: MouseEvent) => this.onDragStart(e, item));
        rebind(handle, `touchstart.sortable-${this.eid}`, (e: TouchEvent) => this.onDragStart(e, item), { passive: false });
    }

    /**
     * Handles the start of drag operation
     * @param e - Mouse or touch event
     * @param item - Item being dragged
     */
    private onDragStart(e: MouseEvent | TouchEvent, item: HTMLElement): void {
        e.preventDefault();

        // Store initial drag state
        this.draggedItem = item;
        this.startY = e instanceof MouseEvent ? e.clientY : e.touches[0].clientY;
        this.oldIndex = this.getItemIndex(item);
        this.containerRect = this.container.getBoundingClientRect();
        this.itemRect = item.getBoundingClientRect();
        this.startTop = this.itemRect.top;

        const rect = this.itemRect;

        // Set placeholder dimensions to match dragged item
        css(this.placeholder, {
            height: rect.height,
            margin: window.getComputedStyle(item).margin,
            width: rect.width
        });

        // Mark item as dragging for visual feedback
        addClass(item, 'tex-sortable-item-dragging');

        // Insert placeholder at original item position
        item.parentNode?.insertBefore(this.placeholder, item);

        // Position dragged item absolutely for smooth movement
        css(item, {
            position: 'fixed',
            left: rect.left + 'px',
            top: rect.top + 'px',
            width: rect.width + 'px',
            margin: '0',
            zIndex: '9999',
            transform: 'translateY(0)',
            willChange: 'transform'
        });

        // Trigger onStart callback if provided
        if (this.options.onStart) {
            this.options.onStart(item, this.oldIndex);
        }

        // Add global event listeners for drag movement and end
        on(document, `mousemove.sortable-${this.eid}`, this.onDragMove);
        on(document, `touchmove.sortable-${this.eid}`, this.onDragMove, { passive: false });
        on(document, `mouseup.sortable-${this.eid}`, this.onDragEnd);
        on(document, `touchend.sortable-${this.eid}`, this.onDragEnd);
        on(document, `touchcancel.sortable-${this.eid}`, this.onDragEnd);
    }

    /**
     * Handles drag movement
     * Updates dragged item position and placeholder position
     */
    private onDragMove = (e: MouseEvent | TouchEvent): void => {
        if (!this.draggedItem || !this.containerRect || !this.itemRect) return;

        e.preventDefault();

        // Calculate vertical movement
        const clientY = e instanceof MouseEvent ? e.clientY : e.touches[0].clientY;
        let deltaY = clientY - this.startY;

        // Constrain movement within container bounds
        const minY = this.containerRect.top - this.startTop;
        const maxY = this.containerRect.bottom - this.startTop - this.itemRect.height;

        deltaY = Math.max(minY, Math.min(maxY, deltaY));

        // Apply transform for smooth movement
        this.draggedItem.style.transform = `translateY(${deltaY}px)`;

        // Update placeholder position based on mouse location
        this.updatePlaceholderPosition(clientY);
    }

    /**
     * Updates placeholder position based on mouse Y coordinate
     * @param mouseY - Current mouse Y coordinate
     */
    private updatePlaceholderPosition(mouseY: number): void {
        if (!this.draggedItem || !this.containerRect) return;

        const items = this.getVisibleItems();
        const placeholderRect = this.placeholder.getBoundingClientRect();
        const placeholderCenter = placeholderRect.top + placeholderRect.height / 2;
        const clampedMouseY = Math.max(this.containerRect.top, Math.min(this.containerRect.bottom, mouseY));

        // Iterate through items to find where placeholder should be inserted
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const rect = item.getBoundingClientRect();
            const itemCenter = rect.top + rect.height / 2;

            // Check if placeholder should move down
            if (placeholderCenter < itemCenter && clampedMouseY > itemCenter) {
                if (i < items.length - 1) {
                    this.container.insertBefore(this.placeholder, items[i + 1]);
                } else {
                    this.container.appendChild(this.placeholder);
                }

                // Trigger onMove callback if provided
                if (this.options.onMove && this.draggedItem) {
                    const newIndex = this.getTargetIndex();
                    this.options.onMove(this.draggedItem, this.oldIndex, newIndex);
                }
                break;
            }

            // Check if placeholder should move up
            if (placeholderCenter > itemCenter && clampedMouseY < itemCenter) {
                this.container.insertBefore(this.placeholder, item);

                // Trigger onMove callback if provided
                if (this.options.onMove && this.draggedItem) {
                    const newIndex = this.getTargetIndex();
                    this.options.onMove(this.draggedItem, this.oldIndex, newIndex);
                }
                break;
            }
        }
    }

    /**
     * Handles drag end - finalizes item position and cleans up
     */
    private onDragEnd = (): void => {
        if (this.draggedItem && this.placeholder.parentNode) {
            const newIndex = this.getTargetIndex();

            // Remove dragging class and reset styles
            removeClass(this.draggedItem, 'tex-sortable-item-dragging');
            css(this.draggedItem, {
                position: '',
                left: '',
                top: '',
                width: '',
                margin: '',
                zIndex: '',
                transform: '',
                willChange: ''
            })

            // Place item in its new position and remove placeholder
            this.container.insertBefore(this.draggedItem, this.placeholder);
            this.placeholder.remove();

            // Reinitialize the item to ensure proper event listeners
            this.initItem(this.draggedItem);

            // Trigger onEnd callback if position changed
            if (this.options.onEnd && this.oldIndex !== newIndex) {
                this.options.onEnd(this.draggedItem, this.oldIndex, newIndex);
            }

            // Clear drag state
            this.containerRect = null;
            this.itemRect = null;
            this.draggedItem = null;
        }

        // Remove all global event listeners
        off(document, `mousemove.sortable-${this.eid}`);
        off(document, `touchmove.sortable-${this.eid}`);
        off(document, `mouseup.sortable-${this.eid}`);
        off(document, `touchend.sortable-${this.eid}`);
        off(document, `touchcancel.sortable-${this.eid}`);
    }

    /**
     * Public method to update sortable items (useful when items are dynamically added)
     */
    update(): void {
        const items = this.getItems();
        items.forEach(item => {
            if (!item.classList.contains('tex-sortable-item')) {
                this.initItem(item);
            }
        });
    }

    /**
     * Public method to destroy the sortable instance and clean up all event listeners
     */
    destroy(): void {
        const items = this.getItems();
        items.forEach(item => {
            const handle = this.getHandleElement(item);

            // Remove event listeners from handles
            off(handle, `mousedown.sortable-${this.eid}`);
            off(handle, `touchstart.sortable-${this.eid}`);

            // Remove sortable-related classes
            item.classList.remove('tex-sortable-item');
            handle.classList.remove('tex-sortable-handle');
        });

        // Remove all global event listeners
        off(document, `mousemove.sortable-${this.eid}`);
        off(document, `touchmove.sortable-${this.eid}`);
        off(document, `mouseup.sortable-${this.eid}`);
        off(document, `touchend.sortable-${this.eid}`);
        off(document, `touchcancel.sortable-${this.eid}`);
    }
}