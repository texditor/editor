import { IconItalic } from "@/icons";
import ToolModel from "@/core/models/tool-model";

export default class ItalicTool extends ToolModel {
  protected name: string = "italic";
  protected tagName: string = "i";
  protected tranlation: string = "italic";
  protected icon: string = IconItalic;

  onClick() {
    this.format();

    // const curBlock = this.editor.blockManager.getCurrentBlock();

    // if (curBlock) {
    //     this.editor.selectionApi.selectCurrent()
    //     this.editor.commands.removeFormat('i')
    //     this.editor.selectionApi.selectCurrent()
    // }
  }
}
