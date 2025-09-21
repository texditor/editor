import { IconHeader5 } from "@/icons";
import Header from ".";

export default abstract class H5 extends Header {
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
