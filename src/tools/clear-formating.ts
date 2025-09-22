import { IconClearFormatting } from "@/icons";
import ToolModel from "@/core/models/tool-model";
import { ToolModelInterface } from "@/types/core/models";

export default class ClearFormatingTool extends ToolModel implements ToolModelInterface {
  name: string = "clearFormating";
  protected tranlation: string = "";
  protected icon: string = IconClearFormatting;

  onClick() {
    const { selectionApi, commands } = this.editor;

    selectionApi.selectCurrent();
    commands.clearAllFormatting();
  }
}
