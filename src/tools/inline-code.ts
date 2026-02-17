import type { ToolModelInterface } from "@/types";
import { IconCode } from "@/icons";
import ToolModel from "@/core/models/tool-model";
import "@/styles/tools/inline-code.css";

export default class InlineCodeTool extends ToolModel implements ToolModelInterface {
  name: string = "inlineCode";
  protected tagName: string = "code";
  protected tranlation: string = "code";
  protected icon: string = IconCode;

  onClick() {
    this.format();
  }
}
