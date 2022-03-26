import produce, { setAutoFreeze, setUseProxies } from 'immer';
import { create } from '../../src';
import { measure } from './measure';

const MAX = 1000;

const baseState: { arr: any[]; map: Record<string, any> } = {
  arr: [],
  map: {},
};

const createTestObject = () => ({ a: 1, b: 'b' });

baseState.arr = Array(10 ** 4)
  .fill('')
  .map(() => createTestObject());

Array(10 ** 3)
  .fill(1)
  .forEach((_, i) => {
    baseState.map[i] = { i };
  });

measure(
  'native handcrafted',
  () => {
    setAutoFreeze(false);
    setUseProxies(true);
    return baseState;
  },
  (baseState: any) => {
    for (let i = 0; i < MAX; i++) {
      const state = {
        ...baseState,
        arr: [...baseState.arr, i],
        map: { ...baseState.map, [i]: { i } },
      };
    }
  }
);

measure(
  'mutative',
  () => {
    return baseState;
  },
  (baseState: any) => {
    for (let i = 0; i < MAX; i++) {
      const { state } = create(baseState, (draft) => {
        draft.arr.push(i);
        draft.map[i] = i;
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
        draft.map[i] = i;
      });
    }
  }
);
