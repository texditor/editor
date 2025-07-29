import { IconBold } from "@/icons";
import ToolModel from "@/core/models/tool-model";
export default class BoldTool extends ToolModel {
  protected name: string = "bold";
  protected tagName: string = "b";
  protected tranlation: string = "bold";
  protected icon: string = IconBold;

  onClick() {
    this.format();
  }
}
