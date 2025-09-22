import { IconItalic } from "@/icons";
import ToolModel from "@/core/models/tool-model";
import { ToolModelInterface } from "@/types/core/models";

export default class ItalicTool extends ToolModel implements ToolModelInterface {
  name: string = "italic";
  protected tagName: string = "i";
  protected tranlation: string = "italic";
  protected icon: string = IconItalic;

  onClick() {
    this.format();
  }
}
