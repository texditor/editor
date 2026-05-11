import type { ExtensionModelInterface, ExtensionModelConfig, BaseEvent } from "@/types";
import ExtensionModel from "@/core/models/extension-model";
import { IconUndo } from "@/icons";

export default class Undo extends ExtensionModel  {
  protected configure(): Partial<ExtensionModelConfig> {
    return {
      name: 'undo',
      translation: 'undo',
      icon: IconUndo,
      toggleActive: false,
      groupName: 'history'
    }
  }

  protected onClick(_evt: BaseEvent): void {
    this.editor.historyManager.undo();
  }

  isActive(): boolean {
    return this.editor.historyManager.canUndo();
  }
}
