import type { ToolModelInterface } from "@/types";
import { IconSuperscript } from "@/icons";
import SubscriptTool from "./subscript";

export default class SuperscriptTool extends SubscriptTool implements ToolModelInterface {
  name: string = "superscript";
  protected tagName: string = "sup";
  protected tranlation: string = "superscript";
  protected icon: string = IconSuperscript;
}
