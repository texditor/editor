import type { ToolModelInterface, ToolModelConfig } from "@/types";
import { IconCode } from "@/icons";
import ToolModel from "@/core/models/tool-model";
import "@/styles/tools/inline-code.css";

export default class InlineCodeTool extends ToolModel implements ToolModelInterface {
  protected configure(): Partial<ToolModelConfig> {
    return {
      name: "inlineCode",
      translation: "code",
      tagName: 'code',
      icon: IconCode,
      iconWidth: 16,
      iconHeight: 16
    }
  }
}
