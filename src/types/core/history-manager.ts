import { BlockSchema } from "./models";

/**
 * Interface for selection data to be saved in history
 * Describes cursor position and selected block at the moment of state saving
 * @property start - Starting position of selection in text
 * @property end - Ending position of selection in text
 * @property index - Index of the current block
 * @property itemIndex - Item index inside block (for editable lists, etc.) 
 */
export interface HistoryStateSelectionData {
  start: number;
  end: number;
  index: number;
  itemIndex?: number;
}

/**
 * Interface for history state
 * Stores a complete snapshot of the editor state at a specific moment in time
 * @property content -  Content of all editor blocks
 * @property selection - Current selection data
 * @property timestamp - Timestamp of state creation (Unix timestamp) 
 */
export interface HistoryState {
  content: BlockSchema[];
  selection: HistoryStateSelectionData;
  timestamp: number;
}

/**
 * Interface for history manager
 * Defines API for managing change history, undo and redo operations
 */
export interface HistoryManagerInterface {
  /**
   * Schedule delayed state saving with debouncing
   * Used to optimize frequent changes
   */
  scheduleSave(): void;

  /**
   * Immediately save the current state
   */
  save(): void;

  /**
   * Undo the last operation
   * @returns true if operation was successful, false if nothing to undo
   */
  undo(): boolean;

  /**
   * Redo the previously undone operation
   * @returns true if operation was successful, false if nothing to redo
   */
  redo(): boolean;

  /**
   * Check if undo operation is available
   * @returns true if there are actions to undo
   */
  canUndo(): boolean;

  /**
   * Check if redo operation is available
   * @returns true if there are actions to redo
   */
  canRedo(): boolean;

  /**
   * Clear all history (both past and future states)
   */
  clear(): void;

  /**
   * Get information about current history state
   * @returns Object with count of past and future states
   */
  getHistoryInfo(): { history: number; future: number };

  /**
   * Set the delayed save interval
   * @param interval - interval in milliseconds
   */
  setSaveInterval(interval: number): void;
}