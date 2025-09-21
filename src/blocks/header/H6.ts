import { IconHeader6 } from "@/icons";
import Header from ".";
export default abstract class H6 extends Header {
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
