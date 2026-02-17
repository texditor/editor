import type { ToolModelInterface } from "@/types";
import { IconMarker } from "@/icons";
import ToolModel from "@/core/models/tool-model";

export default class MarkerTool
  extends ToolModel
  implements ToolModelInterface
{
  name: string = "marker";
  protected tagName: string = "mark";
  protected tranlation: string = "marker";
  protected icon: string = IconMarker;

  onClick() {
    this.format();
  }
}
