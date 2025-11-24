import { IconTrash } from "@/icons";
import type { FileActionModelInterface } from "@/types";
import FileActionModel from "@/core/models/file-action-model";
import Files from "..";

export default class DeleteFileAction extends FileActionModel implements FileActionModelInterface {
  name: string = "delete";
  protected icon: string = IconTrash;

  onClick() {
    const model = this.getCurrentBlockModel() as Files,
      currentItem = this.getItem();

    currentItem.remove();

    if (model?.removeIsEmpty) model.removeIsEmpty(this.getCurrentBlock());
  }
}
