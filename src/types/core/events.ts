import { HTMLBlockElement } from "..";

export type EventTriggerObject = {
  [name: string]: {
    [id: string]: CallableFunction;
  };
};

export interface EditorEvent {
  type: string;
  index?: number;
  block?: HTMLBlockElement;
  [key: string]: unknown;
}
