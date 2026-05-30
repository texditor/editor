import type { ExtensionModelConfig } from '@/types';
import ExtensionModel from '@/core/models/extension-model';
import { IconRedo } from '@/icons';

export default class Redo extends ExtensionModel {
  protected configure(): Partial<ExtensionModelConfig> {
    return {
      name: 'redo',
      translation: 'redo',
      icon: IconRedo,
      toggleActive: false,
      groupName: 'history',
    };
  }

  protected onClick(_evt: MouseEvent): void {
    this.editor.historyManager.redo();
  }

  isActive(): boolean {
    return this.editor.historyManager.canRedo();
  }
}
