export type EventHandler<T extends Event = Event> = (evt: T) => void;
export type CustomEvent = Event & { el: EventTarget }