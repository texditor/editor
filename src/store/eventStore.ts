import { EventHandler } from "@/types/utils";

export const eventStore = new WeakMap<EventTarget, Map<string, EventHandler<Event>>>();
