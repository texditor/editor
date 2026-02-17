import type { EventHandler } from "@/types";

export const eventStore = new WeakMap<
  EventTarget,
  Map<string, EventHandler<Event>>
>();
