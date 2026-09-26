import type { BlockModelConfig } from '@/types';
import BlockModel from '@/core/models/block-model';
import '@/styles/entities/blocks/divider.css';
import { IconDivider } from '@/icons';

export default class Divider extends BlockModel {
  protected configure(): Partial<BlockModelConfig> {
    return {
      name: 'divider',
      icon: IconDivider,
      autoParse: false,
      translation: 'divider',
      groupCode: 'divider',
      tagName: 'div',
      editable: false,
      visibleTools: false,
      sanitizer: false,
      normalize: false,
      className: 'tex-divider',
      emptyDetect: false,
      convertible: false,
      customSave: true,
      noData: true,
    };
  }
}
