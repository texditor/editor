import { IconHeader3 } from "@/icons";
import Header from ".";
import { BlockModelInterface } from "@/types";

export default class H3 extends Header implements BlockModelInterface {
  configure() {
    return {
      ...super.configure(),
      ...{
        type: "h3",
        tagName: "h3",
        icon: IconHeader3,
        translationCode: "header3"
      }
    };
  }
}
