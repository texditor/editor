import Texditor from "@/texditor";
import { ToolModelInterface } from "./tool-model";

export interface ToolModelInstanceInterface {
  new (editor: Texditor): ToolModelInterface;
}
