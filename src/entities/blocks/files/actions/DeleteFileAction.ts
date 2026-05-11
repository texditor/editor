import type {
  BaseEvent,
  FileActionModelConfig,
  FileActionModelInterface
} from "@/types";
import { IconTrash } from "@/icons";
import FileActionModel from "@/core/models/file-action-model";

export default class DeleteFileAction extends FileActionModel implements FileActionModelInterface {
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
    const itemNode = this.getItemNode();

    if (blockElement && model && itemNode) {
      const itemIndex = model.getItemIndex(itemNode);
      const index = blockManager.getIndex();

      model.removeItem(itemIndex);

      if (model.isEmpty())
        blockManager.removeBlock();
      else
        blockManager.focus(index);
    }
  }
}
