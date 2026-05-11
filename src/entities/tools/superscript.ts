import type { ToolModelInterface, ToolModelConfig } from "@/types";
import { IconSuperscript } from "@/icons";
import { ToolModel } from "@/core/models";

export default class SuperscriptTool extends ToolModel implements ToolModelInterface {
  protected configure(): Partial<ToolModelConfig> {
    return {
      name: "superscript",
      tagName: 'sup',
      icon: IconSuperscript,
      separate: true,
      iconWidth: 16,
      iconHeight: 16
    }
  }
}
