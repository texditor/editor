import type { BlockModelConfig } from '@/types';
import { IconHeader2 } from '@/icons';
import Header from '.';

export default class H2 extends Header {
  protected configure(): Partial<BlockModelConfig> {
    return {
      ...super.configure(),
      ...{
        name: 'h2',
        tagName: 'h2',
        icon: IconHeader2,
        translation: 'header2',
      },
    };
  }
}
