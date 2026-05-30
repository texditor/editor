import type { BlockModelConfig } from '@/types';
import { IconOrderedList } from '@/icons';
import List from '.';

export default class OL extends List {
  protected configure(): Partial<BlockModelConfig> {
    return {
      ...super.configure(),
      ...{
        name: 'ol',
        tagName: 'ol',
        icon: IconOrderedList,
        translation: 'orderedList',
      },
    };
  }
}
