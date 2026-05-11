import { EventTriggerObject, TexditorEvent } from "@/types";
import { EventManagerInterface } from "@/types/core/base/event-manager";
import { generateRandomString } from "@/utils";

export default abstract class EventManager  {
    /** Storage for registered event callbacks */
    private triggers: EventTriggerObject = {};

    /**
     * @see EventManagerInterface.addEvent
     */
    addEvent(name: string, callback: CallableFunction) {
        const nameOrId = name.split(".");
        const [eventName, eventId] = nameOrId;

        if (!this.triggers[eventName]) this.triggers[eventName] = {};

        if (typeof callback === "function") {
            const id = eventId ? eventId : generateRandomString(16);
            this.triggers[eventName][id] = callback;
        }
    }

    /**
     * @see EventManagerInterface#isEventExists
     */
    isEventExists(name: string) {
        const nameOrId = name.split(".");
        const [eventName, eventId] = nameOrId;

        if (!this.triggers[eventName]) return false;

        if (eventId) {
            if (!this.triggers[eventName][eventId]) return false;
        }

        return true;
    }

    /**
     * @see EventManagerInterface#removeEvent
     */
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

    /**
     * @see EventManagerInterface#triggerEvent
     */
    triggerEvent(name: string, params: TexditorEvent = {}) {
        if (!this.triggers[name]) return;

        const trigger = this.triggers[name];

        if (typeof trigger === "object") {
            for (const eventId in trigger) {
                trigger[eventId](params);
            }
        }
    }
}