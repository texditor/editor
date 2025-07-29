import { BlockModelInstanceInterface } from "./block-model-instance";
import { BlockModelInterface } from "./block-model";

export interface BlockModelStructure {
  instance: BlockModelInstanceInterface;
  model: BlockModelInterface;
  type: string;
  types: string[];
  translation: string;
  icon: string;
}
