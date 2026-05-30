import { EventTriggerObject, Texditor, TexditorEvent } from "@/types";
import type { EventManager as IEventManager } from "@/types/core/base/event-manager";
import { randString } from "snappykit";

export default abstract class EventManager implements IEventManager {
    /** Storage for registered event callbacks */
    private triggers: EventTriggerObject = {};

    /** @see IEventManager.addEvent */
    addEvent(name: string, callback: CallableFunction): void {
        const nameOrId = name.split(".");
        const [eventName, eventId] = nameOrId;

        if (!this.triggers[eventName]) this.triggers[eventName] = {};

        if (typeof callback === "function") {
            const id = eventId ? eventId : randString(16);
            this.triggers[eventName][id] = callback;
        }
    }

    /** @see IEventManager.isEventExists */
    isEventExists(name: string): boolean {
        const nameOrId = name.split(".");
        const [eventName, eventId] = nameOrId;

        if (!this.triggers[eventName]) return false;

        if (eventId) {
            if (!this.triggers[eventName][eventId]) return false;
        }

        return true;
    }

    /** @see IEventManager.removeEvent */
    removeEvent(name: string, id?: string): boolean {
        if (!this.triggers[name]) return false;

        if (id) {
            if (this.triggers[name][id]) {
                delete this.triggers[name][id];
                return true;
            }

            return false;
        }

        delete this.triggers[name];
        return true;
    }

    /** @see IEventManager.triggerEvent */
    triggerEvent(name: string, params: TexditorEvent = {}): void {
        if (!this.triggers[name]) return;

        const trigger = this.triggers[name];
        const editor = this.provideEditor();

        if (editor)
            params.instance = editor

        if (typeof trigger === "object") {
            for (const eventId in trigger) {
                trigger[eventId](params);
            }
        }
    }

    /**
   * Provides the parent component with access to the child's current editor instance.
   * Returns the editor object if initialized, or `null` otherwise.
   */
    protected provideEditor(): Texditor | null {
        return null;
    }
}