import type { ToolModelInterface } from "@/types";
import { IconBold } from "@/icons";
import ToolModel from "@/core/models/tool-model";

export default class BoldTool extends ToolModel implements ToolModelInterface {
  name: string = "bold";
  protected tagName: string = "b";
  protected tranlation: string = "bold";
  protected icon: string = IconBold;

  onClick() {
    this.format();
  }
}
