import type { EventHandler } from "@/types";

export const domEventStore = new WeakMap<
  EventTarget,
  Map<string, EventHandler<Event>>
>();
