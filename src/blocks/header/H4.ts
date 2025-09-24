import { IconHeader4 } from "@/icons";
import Header from ".";
import { BlockModelInterface } from "@/types";

export default class H4 extends Header implements BlockModelInterface {
  configure() {
    return {
      ...super.configure(),
      ...{
        type: "h4",
        tagName: "h4",
        icon: IconHeader4,
        translationCode: "header4"
      }
    };
  }
}
