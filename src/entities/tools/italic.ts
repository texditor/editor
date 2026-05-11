import type { ToolModelInterface, ToolModelConfig } from "@/types";
import { IconItalic } from "@/icons";
import ToolModel from "@/core/models/tool-model";

export default class ItalicTool extends ToolModel  {
  protected configure(): Partial<ToolModelConfig> {
    return {
      name: "italic",
      tagName: 'i',
      icon: IconItalic,
      iconWidth: 16,
      iconHeight: 16
    }
  }
}
