import type { ToolModelInterface } from "@/types";
import { IconClearFormatting } from "@/icons";
import ToolModel from "@/core/models/tool-model";


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
