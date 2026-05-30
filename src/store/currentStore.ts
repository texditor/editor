import { createStore } from 'snappykit';

export const currentStore = createStore({
  el: null as HTMLElement | null,
  index: 0,
});
