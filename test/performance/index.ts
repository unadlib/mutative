import produce, { setAutoFreeze, setUseProxies } from 'immer';
import { create } from '../../src';
import { measure } from './measure';

const MAX = 1000;

const baseState: { arr: any[]; map: Record<string, any> } = {
  arr: [],
  map: {},
};

const createTestObject = () => ({ a: 1, b: 'b' });

baseState.arr = Array(10 ** 5).map(() => createTestObject());

Array(10 ** 4).fill(1).forEach((_, i) => {
  baseState.map[i] = { i };
});

measure(
  'mutative',
  () => {
    return baseState;
  },
  (baseState: any) => {
    for (let i = 0; i < MAX; i++) {
      const { state } = create(baseState, (draft) => {
        // draft.ids.push(i);
        // draft.map[i] = 1;
        draft.a = '1';
      });
    }
  }
);

measure(
  'immer',
  () => {
    setAutoFreeze(false);
    setUseProxies(true);
    return baseState;
  },
  (baseState: any) => {
    for (let i = 0; i < MAX; i++) {
      const state = produce(baseState, (draft: any) => {
        draft.arr.push(i);
        draft.map[i] = createTestObject();
      });
    }
  }
);
