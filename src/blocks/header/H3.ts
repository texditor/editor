import type { BlockModelConfig, BlockModelInterface } from "@/types";
import { IconHeader3 } from "@/icons";
import Header from ".";

export default class H3 extends Header implements BlockModelInterface {
  protected configure(): Partial<BlockModelConfig> {
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
