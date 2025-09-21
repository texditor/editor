import { IconHeader4 } from "@/icons";
import Header from ".";

export default abstract class H4 extends Header {
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
