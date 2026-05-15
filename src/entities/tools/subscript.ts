import type { ToolModelConfig } from "@/types";
import { IconSubscript } from "@/icons";
import ToolModel from "@/core/models/tool-model";

export default class SubscriptTool extends ToolModel  {
  protected configure(): Partial<ToolModelConfig> {
    return {
      name: "subscript",
      tagName: 'sub',
      icon: IconSubscript,
      override: false,
      iconWidth: 16,
      iconHeight: 16
    }
  }
}
