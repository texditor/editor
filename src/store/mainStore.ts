import { TexditorRootElement } from '@/types';
import { createStore } from 'snappykit';

const mainData: { editors: TexditorRootElement[] } = {
  editors: [],
};

export const mainStore = createStore(mainData);
