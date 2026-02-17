import { IconTrash } from "@/icons";
import type { FileActionModelInterface, RenderIconContent } from "@/types";
import FileActionModel from "@/core/models/file-action-model";
import Files from "..";

export default class DeleteFileAction extends FileActionModel implements FileActionModelInterface {
  name: string = "delete";
  protected icon: RenderIconContent = IconTrash;
  protected translation: string = 'delete';
  protected defaultTitle: string = 'Delete file';

  onClick() {
    const model = this.getCurrentBlockModel() as Files,
      currentItem = this.getItem();

    currentItem.remove();

    if (model?.removeIsEmpty) model.removeIsEmpty(this.getCurrentBlock());
  }
}
