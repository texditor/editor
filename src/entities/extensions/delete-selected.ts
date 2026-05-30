import type {
  ExtensionModelConfig
} from "@/types";
import ExtensionModel from "@/core/models/extension-model";
import { IconTrash } from "@/icons";

export default class DeleteSelected extends ExtensionModel {
  protected configure(): Partial<ExtensionModelConfig> {
    return {
      name: 'deleteSelected',
      translation: 'delete',
      icon: IconTrash,
      toggleActive: false,
      groupName: 'block'
    }
  }

  private getSelectedIndices(): number[] {
    const { blockManager } = this.editor;
    const virtualSelection = blockManager.getVirtualSelection();

    if (!virtualSelection)
      return [];

    return virtualSelection.getSelectedIndices();
  }

  protected onClick(_evt: MouseEvent): void {
    const { blockManager } = this.editor,
      indexes = this.getSelectedIndices();

    if (indexes.length)
      blockManager.removeBlock(indexes);
  }

  isVisible(): boolean {
    return this.getSelectedIndices().length > 0;
  }
}
