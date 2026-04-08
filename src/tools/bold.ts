import type { ToolModelInterface, ToolModelConfig } from "@/types";
import { IconBold } from "@/icons";
import ToolModel from "@/core/models/tool-model";

export default class BoldTool extends ToolModel implements ToolModelInterface {
  protected configure(): Partial<ToolModelConfig> {
    return {
      name: "bold",
      tagName: 'b',
      icon: IconBold,
      iconWidth: 16,
      iconHeight: 16
    }
  }
}
