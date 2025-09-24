import { IconHeader5 } from "@/icons";
import Header from ".";
import { BlockModelInterface } from "@/types";

export default class H5 extends Header implements BlockModelInterface {
  configure() {
    return {
      ...super.configure(),
      ...{
        type: "h5",
        tagName: "h5",
        icon: IconHeader5,
        translationCode: "header5"
      }
    };
  }
}
