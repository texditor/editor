import { OutputBlockItem } from "../output";

export interface HistoryState {
  content: OutputBlockItem[];
  selection: { start: number; end: number };
  timestamp: number;
}
