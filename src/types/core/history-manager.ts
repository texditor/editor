import type { OutputBlockItem } from "../output";

export interface HistoryStateSelectionData {
  start: number;
  end: number;
  index: number;
  itemIndex?: number;
}

export interface HistoryState {
  content: OutputBlockItem[];
  selection: HistoryStateSelectionData;
  timestamp: number;
}

export interface HistoryManagerInterface {
  // State saving methods
  scheduleSave(): void;
  save(): void;

  // Undo/Redo methods
  undo(): boolean;
  redo(): boolean;
  canUndo(): boolean;
  canRedo(): boolean;

  // History management methods
  clear(): void;
  getHistoryInfo(): { history: number; future: number };

  // Configuration methods
  setSaveInterval(interval: number): void;
}
