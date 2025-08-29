import Texditor from "@/texditor";
import { ExtensionModelInterface } from "./extension-model";

export interface ExtensionModelInstanceInterface {
  new (editor: Texditor): ExtensionModelInterface;
}
