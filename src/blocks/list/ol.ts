import { IconOrderedList } from "@/icons";
import List from ".";
import { BlockModelInterface } from "@/types";

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
