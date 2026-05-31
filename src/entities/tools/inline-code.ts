import type { ToolModelConfig } from '@/types';
import { IconCode } from '@/icons';
import ToolModel from '@/core/models/tool-model';
import '@/styles/entities/tools/inline-code.css';

export default class InlineCodeTool extends ToolModel {
  protected configure(): Partial<ToolModelConfig> {
    return {
      name: 'inlineCode',
      translation: 'code',
      tagName: 'code',
      override: false,
      icon: IconCode,
      iconWidth: 16,
      iconHeight: 16,
    };
  }
}
