import type { BlockModelConfig } from '@/types';
import BlockModel from '@/core/models/block-model';
import '@/styles/entities/blocks/list.css';
import { IconList } from '@/icons';

export default class List extends BlockModel {
  protected configure(): Partial<BlockModelConfig> {
    return {
      name: 'ul',
      translation: 'list',
      groupCode: 'list',
      tagName: 'ul',
      itemTagName: 'li',
      itemName: 'li',
      itemClassName: 'tex-list-item',
      itemBodyClassName: 'tex-list-item-body',
      autoParse: true,
      autoMerge: true,
      icon: IconList,
      editable: false,
      editableItems: true,
      visibleTools: true,
      sanitizer: true,
      normalize: true,
      convertible: true,
      className: 'tex-list',
      sortableItems: true,
      sanitizerConfig: {
        elements: ['b', 'a', 'i', 's', 'u', 'sup', 'sub', 'mark', 'code'],
        attributes: {
          a: ['href', 'target'],
        },
        protocols: {
          a: {
            href: ['https', 'ftp', 'http', 'mailto'],
          },
        },
      },
    };
  }
}
