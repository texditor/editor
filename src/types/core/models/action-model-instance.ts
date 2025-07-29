import Texditor from "@/texditor";
import { ActionModelInterface } from "./action-model";

export interface ActionModelInstanceInterface {
  new (editor: Texditor): ActionModelInterface;
}
