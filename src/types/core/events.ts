import type { BlockNode } from "..";

export type PasteMapItem = { type: string; node: Node };
export type PasteMap = { schema: string; data: PasteMapItem[] };

/**
 * Event trigger storage structure
 * Maps event names to collections of callback functions with unique IDs
 */
export type EventTriggerObject = {
  [name: string]: {
    [id: string]: CallableFunction;
  };
};

/**
 * Event data structure passed to callbacks
 */
export interface TexditorEvent {
  /** Type of event */
  type?: string;

  /** Block index related to the event */
  index?: number | number[];

  /** Block node involved in the event */
  blockNode?: BlockNode | HTMLElement | null;

  /** The content node inside the block */
  contentNode?: HTMLElement | null;

  /** Element involved in the event */
  el?: Element;

  /** Original DOM event */
  domEvent?: Event;

  /** Additional event data */
  [key: string]: unknown;
}

/**
 * Events manager interface for handling editor events
 */
export interface EventsInterface {
  /**
   * Adds an event listener with optional identifier
   * @param name - Event name (can include .id suffix)
   * @param callback - Function to call when event triggers
   */
  add(name: string, callback: CallableFunction): void;

  /**
   * Checks if an event listener exists
   * @param name - Event name (can include .id suffix)
   * @returns True if event exists
   */
  exists(name: string): boolean;

  /**
   * Removes an event listener
   * @param name - Event name
   * @param id - Optional specific event ID to remove
   * @returns True if removal was successful
   */
  remove(name: string, id?: string): boolean;

  /**
   * Triggers all callbacks for an event
   * @param name - Event name to trigger
   * @param params - Parameters to pass to callbacks
   */
  trigger(name: string, params?: TexditorEvent): void;

  /**
   * Initializes editor when ready
   */
  ready(): void;

  /**
   * Handles content change events
   * @param event - Change event data
   */
  change(event: TexditorEvent): void;

  /**
   * Refreshes event listeners on all blocks
   */
  refresh(): void;

  // Cleanup method
  /**
   * Destroys the events manager and cleans up all listeners
   */
  destroy(): void;
}