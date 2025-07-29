import { IconSubscript } from "@/icons";
import ToolModel from "@/core/models/tool-model";
export default class SubscriptTool extends ToolModel {
  protected name: string = "subscript";
  protected tagName: string = "sub";
  protected tranlation: string = "subscript";
  protected icon: string = IconSubscript;

  onClick() {
    const { selectionApi, commands } = this.editor;

    selectionApi.selectCurrent();
    const allTags = commands.findTags(),
      tags = commands.findTags(this.getTagName());

    if (allTags.length > tags.length) commands.clearAllFormatting();

    this.format();
  }
}
