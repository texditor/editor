import type { EventHandler } from "@/types";
import { eventStore } from "@/store/eventStore";

export function on<T extends Event>(
  element: EventTarget,
  eventName: string,
  handler: EventHandler<T>,
  options?: AddEventListenerOptions | boolean
): void;

export function on(
  element: EventTarget,
  eventName: string,
  handler: EventHandler,
  options?: AddEventListenerOptions | boolean
): void {
  const wrappedHandler = (event: Event & { el: EventTarget }) => {
    event.el = element;
    handler(event);
  };

  const [eventType, id] = eventName.split("."),
    storageKey = id
      ? `${eventType}.${id}`
      : `${eventType}.${Math.random().toString(36).slice(2)}`;

  let handlers = eventStore.get(element);

  if (!handlers) {
    handlers = new Map();
    eventStore.set(element, handlers);
  }

  if (handlers.has(storageKey)) {
    const prevHandler = handlers.get(storageKey)!;

    element.removeEventListener(eventType, prevHandler, options);
  }

  handlers.set(storageKey, wrappedHandler as EventListener);
  element.addEventListener(eventType, wrappedHandler as EventListener, options);
}

export function off(
  element: EventTarget,
  eventName: string,
  options?: AddEventListenerOptions | boolean
): void {
  const [eventType, id] = eventName.split("."),
    handlers = eventStore.get(element);

  if (!handlers) return;

  if (!id) {
    for (const [key, handler] of handlers) {
      if (key.startsWith(`${eventType}.`)) {
        element.removeEventListener(
          eventType,
          handler as EventListener,
          options
        );
        handlers.delete(key);
      }
    }
  } else {
    const storageKey = `${eventType}.${id}`,
      handler = handlers.get(storageKey);

    if (!handler) return;

    element.removeEventListener(eventType, handler as EventListener, options);

    handlers.delete(storageKey);
  }

  if (handlers.size === 0) eventStore.delete(element);
}
