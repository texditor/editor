import { OutputBlockItem } from "../output";

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
