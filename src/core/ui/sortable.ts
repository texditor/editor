import { SortableOptions, SortableScrollAnimation } from "@/types/core/ui/sortable";

export default class Sortable {
    selectorItemsFull: string = "";
    elGhost: HTMLElement | null = null;
    elGrab: HTMLElement | null = null;
    elTarget: HTMLElement | null = null;
    elDrop: HTMLElement | null = null;
    elDropParent: HTMLElement | null = null;
    indexGrab: number = -1;
    indexDrop: number = -1;
    affectedElements: HTMLElement[] = [];
    scrollParent: HTMLElement | null = null;
    scrollDirection: string | null = null;
    scrollAnim: SortableScrollAnimation | null = null;
    edgePressure: number = 0;
    moveTimeout: number | undefined;
    isScrollPrevented: boolean = false;
    hasPointerMoved: boolean = false;
    hasTouchMoved: boolean = false;
    destroyParentClass: boolean = false;
    pointerGrab: { clientX: number; clientY: number } | null = null;
    touchStart: { clientX: number; clientY: number } | null = null;
    _currentEvent: Event | null = null;
    elGrabParent: HTMLElement;
    group: string;
    swap: boolean;
    duration: number;
    easing: string;
    scale: number;
    opacity: number;
    grabTimeout: number;
    parentDrop: boolean;
    moveThreshold: number;
    scrollThreshold: number;
    edgeThreshold: number;
    scrollSpeed: number;
    zIndex: number;
    selectorParent: string;
    selectorItems: string;
    selectorItemsIgnore: string;
    selectorHandler: string;
    selectorIgnoreTarget: string;
    selectorIgnoreFields: string;
    classGhost: string;
    classActive: string;
    classTouch: string;
    classGrab: string;
    classTarget: string;
    classAnimated: string;
    classAnimatedDrop: string;
    classInvalid: string;
    onBeforeGrab: (data: any) => boolean | void;
    onGrab: (data: any) => void;
    onMove: (data: any) => void;
    onBeforeDrop: (data: any) => boolean | void;
    onDrop: (data: any) => void;
    onAnimationEnd: () => void;

    constructor(el: HTMLElement, options: SortableOptions = {}) {
        this.elGrabParent = el;
        this.group = "";
        this.swap = false;
        this.duration = 420;
        this.easing = "cubic-bezier(0.6, 0, 0.6, 1)";
        this.scale = 1.1;
        this.opacity = 0.8;
        this.grabTimeout = 140;
        this.parentDrop = true;
        this.moveThreshold = 0;
        this.scrollThreshold = 8;
        this.edgeThreshold = 50;
        this.scrollSpeed = 10;
        this.zIndex = 2147483647;
        this.selectorParent = ".sortable";
        this.selectorItems = "*";
        this.selectorItemsIgnore = ".sortable-ignore";
        this.selectorHandler = "";
        this.selectorIgnoreTarget = "";
        this.selectorIgnoreFields = `:is(input, select, textarea, button, label, [contenteditable=""], [contenteditable="true"], [tabindex]:not([tabindex^="-"]), a[href]:not(a[href=""]), area[href]):not(:disabled)`;
        this.classGhost = "is-sortable-ghost";
        this.classActive = "is-sortable-active";
        this.classTouch = "is-sortable-touch";
        this.classGrab = "is-sortable-grab";
        this.classTarget = "is-sortable-target";
        this.classAnimated = "is-sortable-animated";
        this.classAnimatedDrop = "is-sortable-animated-drop";
        this.classInvalid = "is-sortable-invalid";
        this.onBeforeGrab = () => {};
        this.onGrab = () => {};
        this.onMove = () => {};
        this.onBeforeDrop = () => {};
        this.onDrop = () => {};
        this.onAnimationEnd = () => {};

        this.init(options);
    }

    getChildren(elParent: HTMLElement | null): HTMLElement[] {
        if (!elParent) return [];
        const children = [...elParent.children] as HTMLElement[];
        const childrenNoGhost = children.filter(el => !el.matches(`.${this.classGhost}`));
        return childrenNoGhost;
    }

    parseDataAttribute(el: HTMLElement | null): Record<string, any> {
        return el?.dataset.sortable?.replace(/\s/g, "").replace(/;$/, "").split(/;/).reduce((acc: Record<string, any>, str) => {
            const [prop, val] = str.split(":");
            acc[prop] = !isNaN(Number(val)) ? Number(val) : /^(true|false)$/.test(val) ? JSON.parse(val) : val;
            return acc;
        }, {}) ?? {};
    }

    isSignificantMove(startXY: { clientX: number; clientY: number }, currentXY: { clientX: number; clientY: number }, distance: number): boolean {
        const { clientX, clientY } = currentXY;
        const deltaX = clientX - startXY.clientX;
        const deltaY = clientY - startXY.clientY;
        const touchMoveDistance = Math.hypot(deltaX, deltaY);
        return touchMoveDistance >= distance;
    }

    insertGhost(): void {
        if (!this.elGrab) return;
        const { x, y, width, height } = this.elGrab.getBoundingClientRect();
        this.elGhost = this.elGrab.cloneNode(true) as HTMLElement;
        Object.assign(this.elGhost.style, {
            position: "fixed",
            left: `${x}px`,
            top: `${y}px`,
            width: `${width}px`,
            height: `${height}px`,
            pointerEvents: "none",
            zIndex: this.zIndex,
            opacity: this.opacity,
        });
        this.elGhost.classList.remove(this.classActive, this.classTarget);
        this.elGhost.classList.add(this.classGhost);
        this.elGhost.animate([
            { scale: this.scale }
        ], {
            duration: 250,
            easing: this.easing,
            fill: "forwards"
        });
        this.elGrabParent.append(this.elGhost);
    }

    removeGhost(): void {
        if (!this.elGhost) return;
        this.elGhost.remove();
        this.elGhost = null;
    }

    animateItem({ el, x, y }: { el: HTMLElement; x: number; y: number }): Animation | undefined {
        const { left, top } = el.getBoundingClientRect();
        if (x === left && y === top) return;
        el.classList.add(this.classAnimated);
        const keyframes = el === this.elGrab ?
            [
                { position: "relative", zIndex: 1, translate: `${x - left}px ${y - top}px`, opacity: 0.9, scale: this.scale },
                { position: "relative", zIndex: 1, translate: "0", opacity: 1, scale: 1 },
            ] : [
                { position: "relative", zIndex: 0, scale: 1.0, translate: `${x - left}px ${y - top}px` },
                { position: "relative", zIndex: 0, scale: 2 - this.scale },
                { position: "relative", zIndex: 0, scale: 1.0, translate: "0" },
            ];
        const anim = el.animate(keyframes as Keyframe[], {
            duration: this.duration,
            easing: this.easing,
            fill: "forwards"
        });
        anim.addEventListener("finish", () => {
            el.classList.remove(this.classAnimated);
            anim.cancel();
        });
        return anim;
    }

    closestElement(el: Element | null, elTarget: Element | null): Element | null {
        while (el && el !== elTarget) el = el.parentElement;
        return el === elTarget ? el : null;
    }

    checkValidity({ clientX = 0, clientY = 0, el }: { clientX?: number; clientY?: number; el?: HTMLElement }): boolean {
        const elFromPoint = el ?? document.elementFromPoint(clientX, clientY) as HTMLElement;
        const elTarget = elFromPoint?.closest(`${this.selectorItemsFull}, ${this.selectorParent}`) as HTMLElement;
        const isIgnored = elFromPoint?.closest(`${this.selectorItemsIgnore}`);
        if (isIgnored) return false;
        const elDropParent = elFromPoint?.closest(this.selectorParent) as HTMLElement;
        const isParentDrop = elTarget === elDropParent;
        const isOntoSelf = elTarget && this.closestElement(elTarget, this.elGrab) === this.elGrab;
        const isSameParent = elDropParent === this.elGrabParent;
        const groupDrop = elDropParent?.dataset.sortableGroup;
        const isValidGroup = !isSameParent && Boolean(groupDrop && this.group === groupDrop);

        if (!this.parentDrop && isParentDrop) return false;

        const isValid =
            !isOntoSelf &&
            !!elTarget &&
            !!elDropParent &&
            (isValidGroup || isSameParent);

        return isValid;
    }

    engine(cb: () => void, fps: number = 60): SortableScrollAnimation {
        const msPerFrame = 1000 / fps;
        let msPrev = 0;
        let id: number | null = null;
        const tick = () => {
            id = requestAnimationFrame(tick);
            const msNow = window.performance.now();
            const msPassed = msNow - msPrev;
            if (msPassed < msPerFrame) return;
            const excessTime = msPassed % msPerFrame;
            msPrev = msNow - excessTime;
            cb();
        };
        const start = () => {
            stop();
            msPrev = performance.now();
            id = requestAnimationFrame(tick);
        };
        const stop = () => {
            if (id !== null) cancelAnimationFrame(id);
            id = null;
            msPrev = 0;
        };
        return { start, stop, tick };
    }

    findScrollParent(el: Element | null | undefined): Element {
        while (el && el !== document.documentElement) {
            const style = getComputedStyle(el);
            if ((el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth) &&
                /^(auto|scroll)$/.test(style.overflowY)) {
                return el;
            }
            el = el.parentElement;
        }
        return document.documentElement;
    }

    scrollStep(): void {
        if (!this.scrollDirection || !this.scrollParent) return;
        const scrollSpeed = this.scrollSpeed * (this.edgePressure / Math.max(this.edgeThreshold, 1));
        if (this.scrollDirection === "up") {
            this.scrollParent.scrollTop -= scrollSpeed;
        } else if (this.scrollDirection === "down") {
            this.scrollParent.scrollTop += scrollSpeed;
        } else if (this.scrollDirection === "left") {
            this.scrollParent.scrollLeft -= scrollSpeed;
        } else if (this.scrollDirection === "right") {
            this.scrollParent.scrollLeft += scrollSpeed;
        }
    }

    startEdgeScroll(direction: string): void {
        if (this.scrollDirection !== direction) {
            this.scrollDirection = direction;
            if (!this.scrollAnim) {
                this.scrollAnim = this.engine(this.scrollStep.bind(this));
                this.scrollAnim?.start();
            }
        }
    }

    stopEdgeScroll(): void {
        this.scrollDirection = null;
        if (this.scrollAnim) {
            this.scrollAnim.stop();
            this.scrollAnim = null;
        }
    }

    handleScrollParent(ev: PointerEvent): void {
        if (!this.scrollParent) {
            this.scrollParent = this.findScrollParent(this.elGrab) as HTMLElement;
        }

        const rect = this.scrollParent.getBoundingClientRect();
        const doc = document.documentElement;
        const isDOC = this.scrollParent === doc;
        const topEdge = isDOC ? 0 : rect.top;
        const bottomEdge = isDOC ? window.innerHeight : rect.bottom;
        const leftEdge = isDOC ? 0 : rect.left;
        const rightEdge = isDOC ? window.innerWidth : rect.right;

        if (ev.clientY < topEdge + this.edgeThreshold) {
            this.edgePressure = Math.min(this.edgeThreshold, this.edgeThreshold - (ev.clientY - topEdge));
            this.startEdgeScroll("up");
        } else if (ev.clientY > bottomEdge - this.edgeThreshold) {
            this.edgePressure = Math.min(this.edgeThreshold, this.edgeThreshold - (bottomEdge - ev.clientY));
            this.startEdgeScroll("down");
        } else if (ev.clientX < leftEdge + this.edgeThreshold) {
            this.edgePressure = Math.min(this.edgeThreshold, this.edgeThreshold - (ev.clientX - leftEdge));
            this.startEdgeScroll("left");
        } else if (ev.clientX > rightEdge - this.edgeThreshold) {
            this.edgePressure = Math.min(this.edgeThreshold, this.edgeThreshold - (rightEdge - ev.clientX));
            this.startEdgeScroll("right");
        } else {
            this.stopEdgeScroll();
        }
    }

    insert(elGrab: HTMLElement, elTarget: HTMLElement): boolean {
        const elGrabParent = elGrab.closest(this.selectorParent) as HTMLElement;
        const grabChildren = this.getChildren(elGrabParent);
        this.indexGrab = grabChildren.indexOf(elGrab);
        const grabSiblings = grabChildren.filter((el) => el !== elGrab);
        this.elDrop = elTarget?.closest(`${this.selectorItemsFull}, ${this.selectorParent}`) as HTMLElement;
        const isDroppedOntoParent = this.elDrop?.matches(this.selectorParent);
        this.elDropParent = this.elDrop?.closest(this.selectorParent) as HTMLElement;

        const dropChildren = this.getChildren(this.elDropParent);
        const isSameParent = elGrabParent === this.elDropParent;

        this.indexDrop = isDroppedOntoParent ?
            Math.max(0, isSameParent ? grabSiblings.length : dropChildren.length) :
            dropChildren.indexOf(this.elDrop);

        this.elGhost?.animate([{ scale: 1.0 }], { duration: 0, fill: "forwards" });
        const ghostRect = this.elGhost?.getBoundingClientRect();

        this.affectedElements = [];

        if (this.swap) {
            this.affectedElements = this.elDrop ? [this.elDrop] : [];
        } else if (isSameParent) {
            const indexMin = isDroppedOntoParent ? this.indexGrab : Math.min(this.indexDrop, this.indexGrab);
            const indexMax = isDroppedOntoParent ? grabSiblings.length : Math.max(this.indexDrop, this.indexGrab);
            this.affectedElements = grabSiblings.slice(indexMin, indexMax) as HTMLElement[];
        } else {
            this.affectedElements = [...grabSiblings.slice(this.indexGrab), ...dropChildren.slice(this.indexDrop)] as HTMLElement[];
        }

        const isValidTarget = this.checkValidity({ el: elTarget });
        const isValidByUser = this.onBeforeDrop?.call(this, {
            elGrab: this.elGrab,
            elGrabParent,
            elGhost: this.elGhost,
            elDrop: this.elDrop,
            elDropParent: this.elDropParent,
            indexGrab: this.indexGrab,
            indexDrop: this.indexDrop,
            isValidTarget,
            isSameParent,
            event: this._currentEvent,
        }) ?? true;
        const isNotActuallyMoved = isSameParent && this.indexGrab === this.indexDrop;
        const isValid = Boolean(this.elDrop) && isValidTarget && isValidByUser && !isNotActuallyMoved;

        if (isValid) {
            const affectedElementsData = this.affectedElements.map((el) => {
                const { x, y } = el.getBoundingClientRect();
                return { el, x, y };
            });

            if (this.swap && !isDroppedOntoParent) {
                const elNext = elGrab.nextSibling;
                this.elDropParent?.insertBefore(elGrab, this.elDrop!.nextSibling);
                elGrabParent?.insertBefore(this.elDrop!, elNext);
            } else {
                if (isDroppedOntoParent) {
                    this.elDropParent?.append(elGrab);
                } else if (isSameParent) {
                    this.elDropParent?.insertBefore(elGrab, this.indexDrop < this.indexGrab ? this.elDrop : this.elDrop!.nextSibling);
                } else {
                    this.elDropParent?.insertBefore(elGrab, this.elDrop);
                }
            }

            affectedElementsData.forEach((data) => {
                if (data.el === elGrab) return;
                this.animateItem(data);
            });
        }

        if (ghostRect) {
            elGrab.classList.add(`${this.classAnimatedDrop}`);
            const anim = this.animateItem({ el: elGrab, x: ghostRect.left, y: ghostRect.top });
            if (anim) {
                anim.addEventListener("finish", () => {
                    elGrab.classList.remove(`${this.classAnimatedDrop}`);
                    this.onAnimationEnd?.call(this);
                });
            } else {
                elGrab.classList.remove(`${this.classAnimatedDrop}`);
            }
        }

        this.removeGhost();
        return isValid;
    }

    grab = (ev: PointerEvent): void => {
        if (this.elGrab) return;

        const evTarget = ev.target as Element;
        const elClosestItem = evTarget.closest(`${this.selectorItemsFull}`) as HTMLElement;
        const isElIgnored = Boolean(
            evTarget !== elClosestItem &&
            (
                (this.selectorIgnoreTarget && evTarget.closest(this.selectorIgnoreTarget)) ||
                (this.selectorIgnoreFields && evTarget.closest(this.selectorIgnoreFields))
            )
        );

        if (isElIgnored || !elClosestItem || elClosestItem.parentElement !== this.elGrabParent) {
            return;
        }

        // Если selectorHandler указан, проверяем что клик был именно на handler
        // Если selectorHandler НЕ указан, разрешаем захват в любой точке элемента
        if (this.selectorHandler) {
            const elHandler = evTarget.closest(this.selectorHandler);
            if (!elHandler || !elClosestItem.contains(elHandler)) {
                return;
            }
        }

        const { clientX, clientY } = ev;
        this.pointerGrab = { clientX, clientY };
        this.elGrab = elClosestItem;
        const grabChildren = this.getChildren(this.elGrabParent);
        this.indexGrab = grabChildren.indexOf(this.elGrab);

        const isUserValidated = this.onBeforeGrab?.call(this, {
            elGrab: this.elGrab,
            elGrabParent: this.elGrabParent,
            indexGrab: this.indexGrab,
            event: ev
        }) ?? true;

        if (isUserValidated) {
            ev.preventDefault();
            this.elGrab.classList.add(this.classActive);
            this.elGrab.style.cursor = "move";
            this.elGrab.style.userSelect = "none";
            if (ev.pointerType === "mouse") {
                this.isScrollPrevented = true;
            }
            this.onGrab?.call(this, {
                elGrab: this.elGrab,
                elGrabParent: this.elGrabParent,
                indexGrab: this.indexGrab,
                event: ev
            });
        } else {
            this.reset();
        }
    }

    move = (ev: PointerEvent): void => {
        if (
            !this.elGrab ||
            !this.isScrollPrevented ||
            (this.hasPointerMoved && !this.elGrab?.hasPointerCapture(ev.pointerId))
        ) return;

        const isSignificantMove = this.isSignificantMove(this.pointerGrab!, ev, this.moveThreshold);

        if (!this.hasPointerMoved && isSignificantMove) {
            this.hasPointerMoved = true;
            this.elGrab.setPointerCapture(ev.pointerId);
            this.elGrab.classList.add(this.classGrab);
            this.insertGhost();
        }

        const { clientX, clientY } = ev;
        
        const elFromPoint = document.elementFromPoint(clientX, clientY);
        
        const elTarget = elFromPoint?.closest(this.selectorItemsFull) as HTMLElement;
        
        const isValidTarget = this.checkValidity({ clientX, clientY });
        
        if (this.elGhost && this.pointerGrab) {
            this.elGhost.style.translate = `${clientX - this.pointerGrab.clientX}px ${clientY - this.pointerGrab.clientY}px`;
            this.elGhost.classList.toggle(this.classInvalid, !isValidTarget);
        }
        this.elGrab.style.cursor = isValidTarget ? "grab" : "not-allowed";

        if (elTarget !== this.elTarget) {
            this.elTarget?.classList.remove(this.classTarget);
            if (isValidTarget && elTarget && !elTarget.matches(this.selectorParent)) {
                this.elTarget = elTarget;
                this.elTarget?.classList.add(this.classTarget);
            } else {
                this.elTarget = null;
            }
        }

        this.handleScrollParent(ev);

        this.onMove?.call(this, {
            elGrab: this.elGrab,
            elGrabParent: this.elGrabParent,
            elGhost: this.elGhost,
            elTarget: this.elTarget,
            isValidTarget,
            event: ev
        });
    }

    drop = (ev: PointerEvent): void => {
        if (!this.elGrab) return;
        this.stopEdgeScroll();
        this.isScrollPrevented = false;
        this.elGrab.style.removeProperty("user-select");
        this.elGrab.style.removeProperty("cursor");
        this.elGrab.classList.remove(this.classActive, this.classGrab, this.classTouch);
        this.elTarget?.classList.remove(this.classTarget);

        const { clientX, clientY } = ev;
        const elFromPoint = document.elementFromPoint(clientX, clientY) as HTMLElement;
        this._currentEvent = ev;
        const isInserted = this.insert(this.elGrab, elFromPoint);
        if (isInserted) this.onDrop?.call(this, {
            elGrab: this.elGrab,
            elGrabParent: this.elGrabParent,
            elDrop: this.elDrop,
            elDropParent: this.elDropParent,
            indexGrab: this.indexGrab,
            indexDrop: this.indexDrop,
            event: ev
        });

        this.reset();
        this.removeGhost();
    }

    handleTouchStart = (ev: TouchEvent): void => {
        if (!this.elGrab || this.touchStart) return;
        const { clientX, clientY } = ev.touches[0];
        this.touchStart = { clientX, clientY };
        if (this.moveTimeout) clearTimeout(this.moveTimeout);
        this.moveTimeout = window.setTimeout(() => {
            if (!this.hasTouchMoved) {
                this.elGrab?.classList.add(`${this.classTouch}`);
                this.isScrollPrevented = true;
            }
        }, this.grabTimeout);
    }

    handleTouchMove = (ev: TouchEvent): void => {
        if (!this.elGrab || !this.touchStart) return;

        if (this.isScrollPrevented) {
            if (ev.cancelable) ev.preventDefault();
            return;
        }

        const isSignificantMove = this.isSignificantMove(this.touchStart, ev.touches[0], this.scrollThreshold);
        if (!this.hasTouchMoved && isSignificantMove) {
            this.hasTouchMoved = true;
            clearTimeout(this.moveTimeout);
            this.moveTimeout = undefined;
        }
    }

    sort(fn: (a: HTMLElement, b: HTMLElement) => number): HTMLElement[] {
        const items = this.getChildren(this.elGrabParent);
        const affectedElementsData = items.map((el) => {
            const { x, y } = el.getBoundingClientRect();
            return { el, x, y };
        });
        const itemsSorted = [...items].sort(fn);
        this.elGrabParent.append(...itemsSorted);
        affectedElementsData.forEach((data) => this.animateItem(data));
        return itemsSorted;
    }

    reset(): void {
        this.elGhost = null;
        this.elGrab = null;
        this.elTarget = null;
        this.elDrop = null;
        this.elDropParent = null;
        this.indexGrab = -1;
        this.indexDrop = -1;
        this.affectedElements = [];
        this.scrollParent = null;
        this.scrollDirection = null;
        this.scrollAnim = null;
        this.edgePressure = 0;
        this.moveTimeout = undefined;
        this.isScrollPrevented = false;
        this.pointerGrab = null;
        this.touchStart = null;
        this.hasPointerMoved = false;
        this.hasTouchMoved = false;
    }

    init(options: SortableOptions): void {
        this.destroy();
        const data = this.parseDataAttribute(this.elGrabParent);
        Object.assign(this, options, data);
        this.reset();

        if (this.selectorParent[0]?.trim() === "." && !this.elGrabParent.matches(this.selectorParent)) {
            this.elGrabParent.classList.add(`${this.selectorParent.replace(/^\./, "")}`);
            this.destroyParentClass = true;
        }

        this.selectorItems = (this.selectorItems ?? "*").replace(/^(?! *>)/, "> $&");
        this.selectorItemsFull = `${this.selectorParent}${this.selectorItems}${this.selectorItemsIgnore ? `:not(${this.selectorItemsIgnore})` : ""}`;
        
        if (this.elGrabParent) {
            this.elGrabParent.addEventListener("touchstart", this.handleTouchStart);
            this.elGrabParent.addEventListener("touchmove", this.handleTouchMove);
            this.elGrabParent.addEventListener("pointerdown", this.grab);
            this.elGrabParent.addEventListener("pointermove", this.move);
            this.elGrabParent.addEventListener("pointerup", this.drop);
            this.elGrabParent.addEventListener("pointercancel", this.drop);
            if (this.group !== "") this.elGrabParent.dataset.sortableGroup = this.group;
        }
    }

    destroy(): void {
        this.removeGhost();
        if (this.elGrabParent) {
            this.elGrabParent.removeEventListener("touchstart", this.handleTouchStart);
            this.elGrabParent.removeEventListener("touchmove", this.handleTouchMove);
            this.elGrabParent.removeEventListener("pointerdown", this.grab);
            this.elGrabParent.removeEventListener("pointermove", this.move);
            this.elGrabParent.removeEventListener("pointerup", this.drop);
            this.elGrabParent.removeEventListener("pointercancel", this.drop);
            if (this.group !== "") delete this.elGrabParent.dataset.sortableGroup;
            if (this.destroyParentClass) this.elGrabParent.classList.remove(`${this.selectorParent.replace(/^\./, "")}`);
        }
    }
}
