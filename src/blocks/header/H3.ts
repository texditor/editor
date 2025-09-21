import { IconHeader3 } from "@/icons";
import Header from ".";

export default abstract class H3 extends Header {
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
