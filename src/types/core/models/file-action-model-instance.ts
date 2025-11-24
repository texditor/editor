import Texditor from "@/texditor";
import { HTMLBlockElement } from "../html-block-element";
import { FileActionModelInterface } from "./file-action-model";

export interface FileActionModelInstanceInterface {
  new (
    editor: Texditor,
    item: HTMLElement,
    container: HTMLElement,
    fileBlock: HTMLBlockElement
  ): FileActionModelInterface;
}
