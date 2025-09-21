import { IconHeader2 } from "@/icons";
import Header from ".";

export default abstract class H2 extends Header {
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
