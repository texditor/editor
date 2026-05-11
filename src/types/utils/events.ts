export type EventHandler<T extends Event = Event> = (evt: T) => void;
export type BaseEvent = Event & { delegateTarget: EventTarget }