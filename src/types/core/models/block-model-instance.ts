import Texditor from "@/texditor";
import { BlockModelInterface } from "./block-model";

export interface BlockModelInstanceInterface {
  new (editor: Texditor): BlockModelInterface;
}
