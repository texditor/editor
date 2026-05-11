import type { BlockModelConfig, BlockModelInterface } from "@/types";
import { IconHeader5 } from "@/icons";
import Header from ".";

export default class H5 extends Header  {
  protected configure(): Partial<BlockModelConfig> {
    return {
      ...super.configure(),
      ...{
        name: "h5",
        tagName: "h5",
        icon: IconHeader5,
        translation: "header5"
      }
    };
  }
}
