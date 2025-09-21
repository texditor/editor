import { IconOrderedList } from "@/icons";
import List from ".";

export default abstract class OL extends List {
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
