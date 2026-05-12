import '@/styles/core/ui/selection.css';
import { VirtualSelection, VirtualSelectionOptions } from '@/types/core/ui/virtual-selection';
import {
  addClass,
  append,
  css,
  generateRandomString,
  make,
  off,
  on,
  query,
  removeClass
} from '@/utils';

export default class VirtualSelection  {
  private options: Required<VirtualSelectionOptions>;
  private blocks: HTMLElement[] = [];
  private isDragging = false;
  private isLassoActive = false;
  private hasMoved = false;
  private isTouchScrolling = false;
  private startedInContentEditable = false;
  private contentEditableStartPoint = { x: 0, y: 0 };
  private startPointInDocument = { x: 0, y: 0 };
  private currentPointInDocument = { x: 0, y: 0 };
  private selectedIndices: Set<number> = new Set();
  private selectionRect: HTMLElement | null = null;
  private eventId = 'slUi_' + generateRandomString(8);
  private autoScrollInterval: number | null = null;
  private startBlock: HTMLElement | null = null;

  // Touch delay
  private touchDelayTimeout: number | null = null;
  private pendingLassoActivation = false;

  constructor(options: VirtualSelectionOptions) {
    this.options = {
      blocksContainer: options.blocksContainer,
      blockSelector: options.blockSelector,
      selectionZone: options.selectionZone || document.body,
      selectedBlockClass: options.selectedBlockClass || 'tex-ui-vs-selected',
      exitTolerance: options.exitTolerance || 12,
      autoScrollSpeed: options.autoScrollSpeed || 20,
      autoScrollEdgeThreshold: options.autoScrollEdgeThreshold || 60,
      touchActivationDelay: options.touchActivationDelay || 200,
      onSelectionChange: options.onSelectionChange || (() => { }),
      onLassoStart: options.onLassoStart || (() => { }),
      onLassoEnd: options.onLassoEnd || (() => { }),
    };

    this.init();
  }

  /**
   * Sets the CSS touch-action property on the selection zone.
   * @param value - The touch-action CSS value (e.g., 'none', 'pan-y')
   * @private
   */
  private setTouchAction(value: string) {
    css(
      this.options.selectionZone,
      'touch-action',
      value
    );
  }

  /**
   * Initializes the VirtualSelection instance.
   * Refreshes blocks, creates DOM elements, attaches event listeners, and sets initial touch behavior.
   * @private
   */
  private init(): void {
    this.refreshBlocks();
    this.createElements();
    this.attachEvents();
    this.setTouchAction('pan-y');
  }

  /**
   * Checks if an element or any of its ancestors is inside a contentEditable container.
   * @param el - The DOM element to check
   * @returns True if the element is inside contentEditable, false otherwise
   * @private
   */
  private isInsideContentEditable(el: HTMLElement): boolean {
    let current: HTMLElement | null = el;
    while (current && current !== this.options.selectionZone) {
      if (current.contentEditable === 'true') return true;
      current = current.parentElement;
    }
    return false;
  }

  /**
   * Gets the full bounding rectangle of a block including its visual boundaries.
   * @param block - The block element
   * @returns DOMRect with full block dimensions in document coordinates
   * @private
   */
  private getFullBlockRect(block: HTMLElement): DOMRect {
    const rect = block.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(block);

    // Get margins
    const marginTop = parseFloat(computedStyle.marginTop);
    const marginRight = parseFloat(computedStyle.marginRight);
    const marginBottom = parseFloat(computedStyle.marginBottom);
    const marginLeft = parseFloat(computedStyle.marginLeft);

    return new DOMRect(
      rect.left + window.scrollX - marginLeft,
      rect.top + window.scrollY - marginTop,
      rect.width + marginLeft + marginRight,
      rect.height + marginTop + marginBottom
    );
  }

  /**
   * Checks if the cursor has completely exited the block's visual boundaries.
   * @param currentPoint - Current cursor point
   * @param startBlock - The block where selection started
   * @returns True if cursor is outside block boundaries by at least exitTolerance
   * @private
   */
  private hasExitedBlockBoundaries(currentPoint: { x: number; y: number }, startBlock: HTMLElement): boolean {
    const fullRect = this.getFullBlockRect(startBlock);

    // Calculate distance to each edge
    const distances = {
      left: currentPoint.x - fullRect.left,
      right: fullRect.right - currentPoint.x,
      top: currentPoint.y - fullRect.top,
      bottom: fullRect.bottom - currentPoint.y
    };

    // Find the minimum distance to any edge
    const minDistance = Math.min(
      Math.abs(distances.left),
      Math.abs(distances.right),
      Math.abs(distances.top),
      Math.abs(distances.bottom)
    );

    // Check if we're outside the block
    const isOutside = currentPoint.x < fullRect.left ||
      currentPoint.x > fullRect.right ||
      currentPoint.y < fullRect.top ||
      currentPoint.y > fullRect.bottom;

    // If outside and distance exceeds tolerance, we've exited
    if (isOutside && minDistance >= this.options.exitTolerance) {
      return true;
    }

    return false;
  }

  /**
   * Determines if lasso should be activated for mouse interactions.
   * @param currentPoint - Current cursor point
   * @param target - Target element
   * @returns True if lasso should be activated
   * @private
   */
  private shouldActivateLassoForMouse(currentPoint: { x: number; y: number }): boolean {
    if (!this.startedInContentEditable) return false;

    // Find the block that contains the starting point
    const startBlock = this.getBlockAtPoint(
      this.contentEditableStartPoint.x,
      this.contentEditableStartPoint.y
    );

    if (!startBlock) return false;

    // Check if we've completely exited the block's visual boundaries
    return this.hasExitedBlockBoundaries(currentPoint, startBlock);
  }

  /**
   * Refreshes internal blocks cache by querying DOM for current blocks.
   * Updates indices and reapplies selection state.
   * @returns {void}
   */
  refreshBlocks(): void {
    this.blocks = [];

    query(
      this.options.blockSelector,
      (block: HTMLElement) => {
        this.blocks.push(block);
      },
      this.options.blocksContainer
    );

    this.updateBlocksVisuals(true);
  }

  /**
   * Creates the visual selection rectangle element for lasso selection.
   * @private
   */
  private createElements(): void {
    this.selectionRect = make(
      'div',
      (div: HTMLDivElement) =>
        addClass(div, 'tex-ui-vs-rect')
    );

    append(document.body, this.selectionRect);
  }

  /**
   * Attaches event listeners for mouse and touch interactions.
   * @private
   */
  private attachEvents(): void {
    const eid = this.eventId;
    const zone = this.options.selectionZone;

    on(zone, 'mousedown.' + eid, (evt: MouseEvent) => this.onMouseDown(evt));
    on(window, 'mousemove.' + eid, (evt: MouseEvent) => this.onMouseMove(evt));
    on(window, 'mouseup.' + eid, () => this.onMouseUp());
    on(zone, 'touchstart.' + eid, (evt: TouchEvent) => this.onTouchStart(evt), { passive: false });
    on(zone, 'touchmove.' + eid, (evt: TouchEvent) => this.onTouchMove(evt), { passive: false });
    on(window, 'touchend.' + eid, () => this.onTouchEnd());
  }

  /**
   * Converts viewport coordinates to document coordinates.
   * @param x - X coordinate relative to viewport
   * @param y - Y coordinate relative to viewport
   * @returns Object with x and y coordinates relative to document
   * @private
   */
  private viewportToDocument(x: number, y: number) {
    return { x: x + window.scrollX, y: y + window.scrollY };
  }

  /**
   * Converts document coordinates to viewport coordinates.
   * @param x - X coordinate relative to document
   * @param y - Y coordinate relative to document
   * @returns Object with x and y coordinates relative to viewport
   * @private
   */
  private documentToViewport(x: number, y: number) {
    return { x: x - window.scrollX, y: y - window.scrollY };
  }

  /**
   * Finds the block element at the specified point.
   * @param x - X coordinate in document
   * @param y - Y coordinate in document
   * @returns The block element or null
   * @private
   */
  private getBlockAtPoint(x: number, y: number): HTMLElement | null {
    for (const block of this.blocks) {
      const fullRect = this.getFullBlockRect(block);
      if (x >= fullRect.left && x <= fullRect.right && y >= fullRect.top && y <= fullRect.bottom) {
        return block;
      }
    }
    return null;
  }

  /**
   * Starts automatic scrolling when cursor approaches viewport edges during lasso selection.
   * @private
   */
  private startAutoScroll() {
    if (this.autoScrollInterval) return;

    this.autoScrollInterval = window.setInterval(() => {
      if (!this.isLassoActive || !this.isDragging) return;

      const viewportY = this.currentPointInDocument.y - window.scrollY;
      const threshold = this.options.autoScrollEdgeThreshold;

      let scrollY = 0;

      if (viewportY < threshold) {
        scrollY = -this.options.autoScrollSpeed;
      } else if (viewportY > window.innerHeight - threshold) {
        scrollY = this.options.autoScrollSpeed;
      }

      if (scrollY !== 0) {
        window.scrollBy(0, scrollY);
        this.currentPointInDocument.y += scrollY;
        this.updateLassoSelection();
      }
    }, 16);
  }

  /**
   * Stops the auto-scroll interval.
   * @private
   */
  private stopAutoScroll() {
    if (this.autoScrollInterval) {
      clearInterval(this.autoScrollInterval);
      this.autoScrollInterval = null;
    }
  }

  /**
   * Activates lasso selection mode.
   * Prevents scrolling, disables touch actions, and triggers onLassoStart callback.
   * @private
   */
  private startLassoMode() {
    if (this.isLassoActive) return;

    this.isLassoActive = true;

    this.startAutoScroll();

    const sel = window.getSelection();
    if (sel) sel.removeAllRanges();

    this.options.onLassoStart();
  }

  /**
   * Deactivates lasso selection mode.
   * Restores touch actions, stops auto-scroll, hides selection rectangle, and triggers onLassoEnd.
   * @private
   */
  private stopLassoMode() {
    if (!this.isLassoActive) return;

    this.isLassoActive = false;

    this.stopAutoScroll();

    this.options.onLassoEnd();

    if (this.selectionRect) {
      css(this.selectionRect, 'display', 'none');
    }
  }

  /**
   * Updates the position and size of the selection rectangle based on drag points.
   * @private
   */
  private updateSelectionRect() {
    if (!this.selectionRect || !this.isLassoActive) return;

    const start = this.documentToViewport(
      this.startPointInDocument.x,
      this.startPointInDocument.y
    );

    const current = this.documentToViewport(
      this.currentPointInDocument.x,
      this.currentPointInDocument.y
    );

    css(this.selectionRect, {
      display: 'block',
      left: Math.min(start.x, current.x) + 'px',
      top: Math.min(start.y, current.y) + 'px',
      width: Math.abs(current.x - start.x) + 'px',
      height: Math.abs(current.y - start.y) + 'px'
    });
  }

  /**
   * Calculates which blocks intersect with the lasso selection rectangle.
   * Updates selected indexes and visual states.
   * @private
   */
  private updateLassoSelection() {
    if (!this.isLassoActive) return;

    const rect = new DOMRect(
      Math.min(this.startPointInDocument.x, this.currentPointInDocument.x),
      Math.min(this.startPointInDocument.y, this.currentPointInDocument.y),
      Math.abs(this.currentPointInDocument.x - this.startPointInDocument.x),
      Math.abs(this.currentPointInDocument.y - this.startPointInDocument.y)
    );

    const selected = new Set<number>();

    this.blocks.forEach((b, i) => {
      const fullRect = this.getFullBlockRect(b);

      if (!(rect.right < fullRect.left || rect.left > fullRect.right ||
        rect.bottom < fullRect.top || rect.top > fullRect.bottom)) {
        selected.add(i);
      }
    });

    this.selectedIndices = selected;
    this.updateBlocksVisuals();
    this.updateSelectionRect();
  }

  /**
   * Applies or removes the selected class on blocks based on current selection.
   * Triggers onSelectionChange callback with updated selection data.
   * @private
   */
  private updateBlocksVisuals(skipEvents: boolean = false) {
    const cls = this.options.selectedBlockClass;

    this.blocks.forEach((b, i) => {
      if (this.selectedIndices.has(i)) addClass(b, cls);
      else removeClass(b, cls);
    });

    if (!skipEvents) {
      this.options.onSelectionChange(
        Array.from(this.selectedIndices),
        this.getSelectedBlocks()
      );
    }
  }

  /**
  * Handles mouse down event to initiate selection.
  * @param e - The mouse event
  * @private
  */
  private onMouseDown(e: MouseEvent) {
    if (e.button !== 0) return;

    const target = e.target as HTMLElement;
    const p = this.viewportToDocument(e.clientX, e.clientY);

    this.startPointInDocument = p;
    this.currentPointInDocument = p;
    this.isDragging = true;
    this.hasMoved = false;
    this.startedInContentEditable = this.isInsideContentEditable(target);
    this.contentEditableStartPoint = p;
    this.startBlock = this.getBlockAtPoint(p.x, p.y);
  }

  /**
   * Handles mouse move event for lasso selection.
   * @param e - The mouse event
   * @private
   */
  private onMouseMove(e: MouseEvent) {
    if (!this.isDragging) return;

    const p = this.viewportToDocument(e.clientX, e.clientY);
    this.currentPointInDocument = p;

    const dx = p.x - this.startPointInDocument.x;
    const dy = p.y - this.startPointInDocument.y;

    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) this.hasMoved = true;

    if (!this.isLassoActive && this.hasMoved && !this.startBlock) {
      this.startLassoMode();
    }

    if (!this.isLassoActive && this.hasMoved && this.startBlock) {
      if (this.hasExitedBlockBoundaries(p, this.startBlock)) {
        this.startLassoMode();
        e.preventDefault();
      }
    }

    if (this.isLassoActive) {
      this.updateLassoSelection();
      e.preventDefault();
    }
  }

  /**
   *  Handles mouse up event to finalize selection.
   * @private
   */
  private onMouseUp() {
    if (!this.isDragging) return;

    if (this.isLassoActive) {
      this.updateLassoSelection();
      this.stopLassoMode();
    }

    this.isDragging = false;
    this.startedInContentEditable = false;
    this.pendingLassoActivation = false;
    this.startBlock = null;

    if (this.touchDelayTimeout) {
      clearTimeout(this.touchDelayTimeout);
      this.touchDelayTimeout = null;
    }
  }

  /**
   * Handles touch start event for mobile selection.
   * @param e - The touch event
   * @private
   */
  private onTouchStart(e: TouchEvent) {
    const touch = e.touches[0];
    if (!touch) return;

    const target = e.target as HTMLElement;
    const p = this.viewportToDocument(touch.clientX, touch.clientY);

    this.startPointInDocument = p;
    this.currentPointInDocument = p;
    this.isDragging = true;
    this.hasMoved = false;
    this.startedInContentEditable = this.isInsideContentEditable(target);
    this.contentEditableStartPoint = p;
    this.isTouchScrolling = false;
    this.pendingLassoActivation = false;

    // Save block
    this.startBlock = this.getBlockAtPoint(p.x, p.y);

    if (this.touchDelayTimeout) {
      clearTimeout(this.touchDelayTimeout);
      this.touchDelayTimeout = null;
    }

    this.setTouchAction('none');
  }

  /**
   * Handles touch move event for lasso selection on mobile devices.
   * @param e - The touch event
   * @private
   */
  private onTouchMove(e: TouchEvent) {
    if (!this.isDragging) return;

    const touch = e.touches[0];
    if (!touch) return;

    const p = this.viewportToDocument(touch.clientX, touch.clientY);
    this.currentPointInDocument = p;

    const dx = p.x - this.startPointInDocument.x;
    const dy = p.y - this.startPointInDocument.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (!this.isLassoActive && absY > absX && absY > 10) {
      this.isTouchScrolling = true;
      this.setTouchAction('pan-y');
      if (this.touchDelayTimeout) {
        clearTimeout(this.touchDelayTimeout);
        this.touchDelayTimeout = null;
      }
      this.pendingLassoActivation = false;
      return;
    }

    if (!this.isLassoActive && !this.isTouchScrolling && (absX > 5 || absY > 5)) {
      if (!this.pendingLassoActivation && !this.touchDelayTimeout) {
        this.pendingLassoActivation = true;

        this.touchDelayTimeout = window.setTimeout(() => {
          if (this.isDragging && !this.isLassoActive && !this.isTouchScrolling) {
            if (!this.startBlock) {
              this.startLassoMode();
              e.preventDefault();
            }
            else if (this.startBlock && this.hasExitedBlockBoundaries(this.currentPointInDocument, this.startBlock)) {
              this.startLassoMode();
              e.preventDefault();
            }
          }
          this.touchDelayTimeout = null;
          this.pendingLassoActivation = false;
        }, this.options.touchActivationDelay);
      }
    }

    if (absX < 3 && absY < 3 && this.pendingLassoActivation) {
      if (this.touchDelayTimeout) {
        clearTimeout(this.touchDelayTimeout);
        this.touchDelayTimeout = null;
        this.pendingLassoActivation = false;
      }
    }

    if (this.isLassoActive) {
      this.updateLassoSelection();
      e.preventDefault();
    }

    if (this.pendingLassoActivation || this.isLassoActive) {
      e.preventDefault();
    }
  }

  /**
   * Handles touch end event to finalize selection on mobile devices.
   * @private
   */
  private onTouchEnd() {
    if (this.touchDelayTimeout) {
      clearTimeout(this.touchDelayTimeout);
      this.touchDelayTimeout = null;
    }

    this.pendingLassoActivation = false;

    if (!this.isDragging) return;

    if (this.isLassoActive) {
      this.updateLassoSelection();
      this.stopLassoMode();
    }

    this.isDragging = false;
    this.startedInContentEditable = false;
    this.isTouchScrolling = false;
    this.startBlock = null;

    this.setTouchAction('pan-y');
  }

  /**
   * Returns array of indices of currently selected blocks.
   * @returns {number[]} Array of selected block indices
   */
  getSelectedIndices(): number[] {
    return Array.from(this.selectedIndices);
  }

  /**
   * Returns array of DOM elements that are currently selected.
   * @returns {HTMLElement[]} Array of selected block elements
   */
  getSelectedBlocks(): HTMLElement[] {
    return Array.from(this.selectedIndices)
      .map(i => this.blocks[i])
      .filter(Boolean);
  }

  /**
   * Clears current selection, removes all selected blocks.
   * @returns {void}
   */
  clearSelection(): void {
    this.selectedIndices.clear();
    this.updateBlocksVisuals(true);
  }

  /**
   * Destroys the VirtualSelection instance.
   * Removes all event listeners, DOM elements, and observers.
   * Performs cleanup to prevent memory leaks.
   * @returns {void}
   */
  destroy(): void {
    this.stopAutoScroll();

    if (this.touchDelayTimeout) {
      clearTimeout(this.touchDelayTimeout);
      this.touchDelayTimeout = null;
    }

    const eid = this.eventId;
    const zone = this.options.selectionZone;

    off(zone, 'mousedown.' + eid);
    off(window, 'mousemove.' + eid);
    off(window, 'mouseup.' + eid);
    off(zone, 'touchstart.' + eid);
    off(zone, 'touchmove.' + eid);
    off(window, 'touchend.' + eid);

    if (this.selectionRect?.parentNode) {
      this.selectionRect.parentNode.removeChild(this.selectionRect);
    }

    // Restore touch-action on destroy
    this.setTouchAction('pan-y');
  }
}