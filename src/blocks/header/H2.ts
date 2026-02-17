import type { BlockModelInterface } from "@/types";
import { IconHeader2 } from "@/icons";
import Header from ".";

export default class H2 extends Header implements BlockModelInterface {
  configure() {
    return {
      ...super.configure(),
      ...{
        type: "h2",
        tagName: "h2",
        icon: IconHeader2,
        translationCode: "header2"
      }
    };
  }
}
