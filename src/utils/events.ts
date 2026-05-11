import type { BaseEvent, EventHandler } from "@/types";
import { domEventStore } from "@/store/domEventStore";

/**
 * Registers an event listener on an element with automatic tracking for later removal
 * @param element - Target DOM element or EventTarget
 * @param eventName - Event name with optional dot-separated ID (e.g., "click.submitBtn")
 * @param handler - Event handler function
 * @param options - AddEventListener options or useCapture flag
 */
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
  const wrappedHandler = (event: BaseEvent) => {
    event.delegateTarget = element;
    handler(event);
  };

  const [eventType, id] = eventName.split("."),
    storageKey = id
      ? `${eventType}.${id}`
      : `${eventType}.${Math.random().toString(36).slice(2)}`;

  let handlers = domEventStore.get(element);

  if (!handlers) {
    handlers = new Map();
    domEventStore.set(element, handlers);
  }

  if (handlers.has(storageKey)) {
    const prevHandler = handlers.get(storageKey)!;

    element.removeEventListener(eventType, prevHandler, options);
  }

  handlers.set(storageKey, wrappedHandler as EventListener);
  element.addEventListener(eventType, wrappedHandler as EventListener, options);
}

/**
 * Removes an event listener from an element
 * @param element - Target DOM element or EventTarget
 * @param eventName - Event name with optional dot-separated ID. If ID is omitted, removes all listeners for that event type
 * @param options - AddEventListener options or useCapture flag that matches the original registration
 */
export function off(
  element: EventTarget,
  eventName: string,
  options?: AddEventListenerOptions | boolean
): void {
  const [eventType, id] = eventName.split("."),
    handlers = domEventStore.get(element);

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

  if (handlers.size === 0) domEventStore.delete(element);
}

/**
 * Replaces an existing event listener with a new one (removes old, adds new)
 * @param element - Target DOM element or EventTarget
 * @param eventName - Event name with optional dot-separated ID
 * @param handler - New event handler function
 * @param options - AddEventListener options or useCapture flag
 */
export function rebind<T extends Event>(
  element: EventTarget,
  eventName: string,
  handler: EventHandler<T>,
  options?: AddEventListenerOptions | boolean
): void;

export function rebind(
  element: EventTarget,
  eventName: string,
  handler: EventHandler,
  options?: AddEventListenerOptions | boolean
): void {
  off(element, eventName, options);
  on(element, eventName, handler, options);
}