import type { ExtensionModelInterface, ExtensionModelConfig, BaseEvent } from "@/types";
import ExtensionModel from "@/core/models/extension-model";
import { IconRedo } from "@/icons";

export default class Redo extends ExtensionModel implements ExtensionModelInterface {

  protected configure(): Partial<ExtensionModelConfig> {
    return {
      name: 'redo',
      translation: 'redo',
      icon: IconRedo,
      toggleActive: false,
      groupName: 'history'
    }
  }

  protected onClick(_evt: BaseEvent): void {
    this.editor.historyManager.redo();
  }

  isActive(): boolean {
    return this.editor.historyManager.canRedo();
  }
}
