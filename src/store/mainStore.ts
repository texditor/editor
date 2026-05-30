import { TexditorRootElement } from "@/types";
import { createStore } from "snappykit";

const mainData: { editor: TexditorRootElement[] } = {
    editor: []
}

export const mainStore = createStore(mainData);