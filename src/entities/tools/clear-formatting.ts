import type { ToolModelConfig } from '@/types';
import { IconClearFormatting } from '@/icons';
import ToolModel from '@/core/models/tool-model';

export default class ClearFormattingTool extends ToolModel {
  protected configure(): Partial<ToolModelConfig> {
    return {
      name: 'clearFormatting',
      icon: IconClearFormatting,
      translation: 'clearFormatting',
      iconWidth: 16,
      iconHeight: 16,
    };
  }

  protected onClick(): void {
    const { selectionApi, commands } = this.editor;

    selectionApi.applyState();
    commands.clearAllFormatting();
  }
}
