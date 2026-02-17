import type { HTMLBlockElement } from "..";

export type EventTriggerObject = {
  [name: string]: {
    [id: string]: CallableFunction;
  };
};

export interface TexditorEvent {
  type?: string;
  index?: number;
  block?: HTMLBlockElement | HTMLElement | null;
  el?: Element;
  domEvent?: Event;
  [key: string]: unknown;
}

export interface EventsInterface {
  // Event management methods
  add(name: string, callback: CallableFunction): void;
  exists(name: string): boolean;
  remove(name: string, id?: string): boolean;
  trigger(name: string, params?: TexditorEvent): void;

  // Editor lifecycle methods
  onReady(callback: CallableFunction): void;
  change(event: TexditorEvent): void;
  refresh(): void;

  // Undo/Redo control
  setUndoRedoEnabled(enabled: boolean): void;

  // Cleanup method
  destroy(): void;
}
