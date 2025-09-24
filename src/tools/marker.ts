import { IconMarker } from "@/icons";
import ToolModel from "@/core/models/tool-model";
import { ToolModelInterface } from "@/types/core/models";

export default class MarkerTool extends ToolModel implements ToolModelInterface {
  name: string = "marker";
  protected tagName: string = "mark";
  protected tranlation: string = "marker";
  protected icon: string = IconMarker;

  onClick() {
    this.format();
  }
}
