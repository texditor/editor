import type { BlockModelConfig, BlockModelInterface } from "@/types";
import { IconHeader4 } from "@/icons";
import Header from ".";

export default class H4 extends Header implements BlockModelInterface {
  protected configure(): Partial<BlockModelConfig> {
    return {
      ...super.configure(),
      ...{
        name: "h4",
        tagName: "h4",
        icon: IconHeader4,
        translation: "header4"
      }
    };
  }
}
