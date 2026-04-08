import type { ToolModelInterface, ToolModelConfig } from "@/types";
import { IconClearFormatting } from "@/icons";
import ToolModel from "@/core/models/tool-model";

export default class ClearFormatingTool extends ToolModel implements ToolModelInterface {
  protected configure(): Partial<ToolModelConfig> {
    return {
      name: "clearFormating",
      icon: IconClearFormatting,
      iconWidth: 16,
      iconHeight: 16
    }
  }

  protected onClick(): void {
    const { selectionApi, commands } = this.editor;

    selectionApi.selectCurrent();
    commands.clearAllFormatting();
  }
}
