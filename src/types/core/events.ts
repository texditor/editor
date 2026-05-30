import type { BlockElement, EventManager, Texditor } from "..";

export type PasteMapItem = { type: string; node: Node };
export type PasteMap = { schema: string; data: PasteMapItem[] };

/**
 * Event data structure passed to callbacks
 */
export interface TexditorEvent {
  /** Type of event */
  type?: string;

  /** Index related to the event */
  index?: number | number[];

  /** Index of the target element related to the event */
  targetIndex?: number | number[];

  /** Block node involved in the event */
  blockElement?: BlockElement | HTMLElement | null;

  /** The content node inside the block */
  contentElement?: HTMLElement | null;

  /** Event-bound DOM element */
  element?: HTMLElement | HTMLElement[] | null;

  /** Original DOM event */
  domEvent?: Event;

  /** Model name */
  modelCode?: string;

  /** Reference to the Texditor instance that fired the event */
  instance?: Texditor;

  /** Additional event data */
  [key: string]: unknown;
}

/**
 * Events manager interface for handling editor events
 */
export interface Events extends EventManager {
  /**
   * Handles content change events
   * @param event - Change event data
   */
  change(event: TexditorEvent): void;

  /**
   * Refreshes event listeners on all blocks
   */
  refresh(): void;

  /**
   * Destroys the events manager and cleans up all listeners
   */
  destroy(): void;
}