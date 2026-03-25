import { createStore } from "@/utils";

export const globalStore = createStore({
    el: null as HTMLElement | null,
    index: 0
});