import type { BlockModelInterface } from "@/types";
import { IconOrderedList } from "@/icons";
import List from ".";

export default class OL extends List implements BlockModelInterface {
  configure() {
    return {
      ...super.configure(),
      ...{
        type: "ol",
        tagName: "ol",
        icon: IconOrderedList,
        translationCode: "orderedList"
      }
    };
  }
}
