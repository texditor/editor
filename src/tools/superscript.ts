import { IconSuperscript } from "@/icons";
import SubscriptTool from "./subscript";

export default class SuperscriptTool extends SubscriptTool {
  protected name: string = "superscript";
  protected tagName: string = "sup";
  protected tranlation: string = "superscript";
  protected icon: string = IconSuperscript;
}
