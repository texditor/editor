import type { BlockModelInterface } from "@/types";
import { IconHeader6 } from "@/icons";
import Header from ".";
export default class H6 extends Header implements BlockModelInterface {
  configure() {
    return {
      ...super.configure(),
      ...{
        type: "h6",
        tagName: "h6",
        icon: IconHeader6,
        translationCode: "header6"
      }
    };
  }
}
