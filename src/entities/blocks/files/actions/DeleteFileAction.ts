import type {
  BaseEvent,
  FileActionModelConfig
} from "@/types";
import { IconTrash } from "@/icons";
import FileActionModel from "@/core/models/file-action-model";

export default class DeleteFileAction extends FileActionModel  {
  protected configure(): Partial<FileActionModelConfig> {
    return {
      name: 'delete',
      icon: IconTrash,
      translation: 'delete'
    }
  }

  protected onClick(_evt: BaseEvent): void {
    const { blockManager } = this.editor;
    const blockElement = this.getBlockElement();
    const model = blockElement?.baseModel;
    const itemElement = this.getItemElement();

    if (blockElement && model && itemElement) {
      const itemIndex = model.getItemIndex(itemElement);
      const index = blockManager.getIndex();

      model.removeItem(itemIndex);

      if (model.isEmpty())
        blockManager.removeBlock();
      else
        blockManager.focus(index);
    }
  }
}
