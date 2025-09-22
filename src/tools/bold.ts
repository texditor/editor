import { IconBold } from "@/icons";
import ToolModel from "@/core/models/tool-model";
import { ToolModelInterface } from "@/types/core/models";
export default class BoldTool extends ToolModel implements ToolModelInterface {
  name: string = "bold";
  protected tagName: string = "b";
  protected tranlation: string = "bold";
  protected icon: string = IconBold;

  onClick() {
    this.format();
  }
}
