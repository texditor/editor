import type { ToolModelConfig } from "@/types";
import { IconMarker } from "@/icons";
import ToolModel from "@/core/models/tool-model";

export default class MarkerTool extends ToolModel {
  protected configure(): Partial<ToolModelConfig> {
    return {
      name: "marker",
      tagName: 'mark',
      icon: IconMarker,
      override: false,
      iconWidth: 16,
      iconHeight: 16
    }
  }
}
