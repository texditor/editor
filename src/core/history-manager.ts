import Texditor from "@/texditor";
import { HistoryState, HistoryStateSelectionData } from "@/types/core/history-state";

export default class HistoryManager {
  private editor: Texditor;
  private history: HistoryState[] = [];
  private future: HistoryState[] = [];
  private maxHistorySize: number = 100;
  private currentState: HistoryState | null = null;
  private isRestoring: boolean = false;
  private saveInterval: number = 800;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(editor: Texditor) {
    this.editor = editor;
    this.editor.events.add("onChange.history", (texditor: Texditor, evt: Event) => {
      if (evt && evt.type != "keydown" && evt.type != "keyup" && evt.type != "historySave") {
        this.save();
      }
    });
  }

  /**
   * Schedule state saving with interval-based debouncing
   */
  public scheduleSave(): void {
    if (this.isRestoring) return;

    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }

    this.saveTimer = setTimeout(() => {
      this.doSave();
    }, this.saveInterval);
  }

  /**
   * Immediately save the current editor state
   */
  public save(): void {
    if (this.isRestoring) return;

    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }

    this.doSave();
  }

  /**
   * Perform the actual state saving operation
   */
  private doSave(): void {
    const { api, blockManager } = this.editor;

    try {
      const content = api.getContent(),
        selection = this.getEditorSelection(),
        blockIndex = blockManager.getIndex(),
        model = blockManager.getModel();

      const selectionData: HistoryStateSelectionData = { index: blockIndex, ...selection };

      if (model?.isEditableChilds()) {
        selectionData.itemIndex = model.getItemIndex();
      }

      const state: HistoryState = {
        content: content,
        selection: selectionData,
        timestamp: Date.now()
      };

      if (!this.currentState || !this.statesEqual(this.currentState, state)) {
        if (this.currentState) {
          this.history.push(this.currentState);

          if (this.history.length > this.maxHistorySize) {
            this.history.shift();
          }
        }

        this.currentState = state;
        this.future = [];

        this.editor.events.change({
          type: "historySave",
          state: this.currentState,
          history: this.history,
          future: this.future
        });
      }
    } catch (error) {
      console.error("Error saving state:", error);
    }
  }

  /**
   * Compare two history states for equality
   * @param state1 - First state to compare
   * @param state2 - Second state to compare
   * @returns True if states are equal, false otherwise
   */
  private statesEqual(state1: HistoryState, state2: HistoryState): boolean {
    if (!state1 || !state2) return false;

    // Compare content using deep equality check
    return this.isDeepEqual(state1.content, state2.content);
  }

  /**
   * Deep equality check for objects/arrays
   */
  private isDeepEqual(obj1: unknown, obj2: unknown): boolean {
    if (obj1 === obj2) return true;

    if (typeof obj1 !== "object" || obj1 === null || typeof obj2 !== "object" || obj2 === null) {
      return false;
    }

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false;

    for (const key of keys1) {
      if (!keys2.includes(key)) return false;

      const val1 = (obj1 as Record<string, unknown>)[key];
      const val2 = (obj2 as Record<string, unknown>)[key];

      if (typeof val1 === "object" && val1 !== null && typeof val2 === "object" && val2 !== null) {
        if (!this.isDeepEqual(val1, val2)) return false;
      } else {
        if (val1 !== val2) return false;
      }
    }

    return true;
  }
  /**
   * Undo the last operation
   * @returns True if undo was successful, false otherwise
   */
  public undo(): boolean {
    if (this.history.length === 0) {
      return false;
    }

    try {
      this.isRestoring = true;

      if (this.currentState) {
        this.future.push(this.currentState);
      }

      this.currentState = this.history.pop()!;
      this.restoreState(this.currentState);
      this.editor.events.change({
        type: "undo",
        state: this.currentState,
        history: this.history,
        future: this.future
      });

      return true;
    } catch (error) {
      this.isRestoring = false;
      console.error("Undo error:", error);
      return false;
    }
  }

  /**
   * Redo the previously undone operation
   * @returns True if redo was successful, false otherwise
   */
  public redo(): boolean {
    if (this.future.length === 0) {
      return false;
    }

    try {
      this.isRestoring = true;

      if (this.currentState) {
        this.history.push(this.currentState);
      }

      this.currentState = this.future.pop()!;
      this.restoreState(this.currentState);
      this.editor.events.change({
        type: "redo",
        state: this.currentState,
        history: this.history,
        future: this.future
      });

      return true;
    } catch (error) {
      this.isRestoring = false;
      console.error("Redo error:", error);
      return false;
    }
  }

  /**
   * Clear all history and future states
   */
  public clear(): void {
    this.history = [];
    this.future = [];
    this.currentState = null;
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
  }

  /**
   * Get current editor selection range
   * @returns Object with start and end positions of selection
   */
  private getEditorSelection(): { start: number; end: number } {
    const { selectionApi } = this.editor;
    try {
      const { position } = selectionApi.current();
      return {
        start: position.start < 0 ? 0 : position.start,
        end: position.end < 0 ? 0 : position.end
      };
    } catch (error) {
      console.warn(error);
      return { start: 0, end: 0 };
    }
  }

  /**
   * Restore editor to a specific historical state
   * @param state - The history state to restore
   */
  private restoreState(state: HistoryState, focusIndex?: number): void {
    const { api, blockManager } = this.editor;

    api.setContent(state.content);

    setTimeout(() => {
      const targetIndex = focusIndex !== undefined ? focusIndex : state.selection.index,
        currentBlock = blockManager.getByIndex(targetIndex);

      if (currentBlock) {
        const { selectionApi } = this.editor,
          model = blockManager.getModel(targetIndex),
          select = (elem: HTMLElement) => {
            selectionApi.select(state.selection.start, state.selection.end, elem, true);
          };

        if (model?.isEditable() && !model?.isEditableChilds()) {
          select(currentBlock);
        } else {
          if (model?.isEditableChilds() && state.selection.itemIndex != undefined) {
            const item = model.getItem(state.selection.itemIndex, currentBlock);

            if (item) {
              select(item as HTMLElement);
            }
          } else {
            currentBlock.click();
            currentBlock.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }
      }

      if (blockManager.isSelectionModeActive()) {
        blockManager.disableSelectionMode();
        blockManager.enableSelectionMode();
      }

      this.isRestoring = false;
    }, 100);
  }

  /**
   * Get history information for debugging purposes
   * @returns Object with history and future state counts
   */
  public getHistoryInfo(): { history: number; future: number } {
    return {
      history: this.history.length,
      future: this.future.length
    };
  }

  /**
   * Check if undo operation is available
   * @returns True if undo is possible, false otherwise
   */
  public canUndo(): boolean {
    return this.history.length > 0;
  }

  /**
   * Check if redo operation is available
   * @returns True if redo is possible, false otherwise
   */
  public canRedo(): boolean {
    return this.future.length > 0;
  }

  /**
   * Set the save interval duration
   * @param interval - Interval duration in milliseconds
   */
  public setSaveInterval(interval: number): void {
    this.saveInterval = interval;
  }
}
