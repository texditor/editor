import type { ExtensionModelConfig } from '@/types';
import ExtensionModel from '@/core/models/extension-model';
import { IconUndo } from '@/icons';

export default class Undo extends ExtensionModel {
  protected configure(): Partial<ExtensionModelConfig> {
    return {
      name: 'undo',
      translation: 'undo',
      icon: IconUndo,
      toggleActive: false,
      groupName: 'history',
    };
  }

  protected onClick(_evt: MouseEvent): void {
    this.editor.historyManager.undo();
  }

  isActive(): boolean {
    return this.editor.historyManager.canUndo();
  }
}
