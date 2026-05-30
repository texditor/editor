import { TexditorEventBase } from '@/types';

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
 * Interface defining the contract for event management
 * All event managers must implement these methods
 */
export interface EventManager {
  /**
   * Adds an event listener with optional identifier
   * @param name - Event name (can include .id suffix)
   * @param callback - Function to call when event triggers
   */
  on(name: string, callback: CallableFunction): void;

  /**
   * Checks if an event listener exists
   * @param name - Event name (can include .id suffix)
   * @returns True if event exists
   */
  hasEvent(name: string): boolean;

  /**
   * Removes an event listener
   * @param name - Event name
   * @param id - Optional specific event ID to remove
   * @returns True if removal was successful
   */
  off(name: string, id?: string): boolean;

  /**
   * Triggers all callbacks for an event
   * @param name - Event name to trigger
   * @param params - Parameters to pass to callbacks
   */
  trigger(name: string, params?: TexditorEventBase): void;
}
