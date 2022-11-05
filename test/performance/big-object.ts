import produce, {
  setAutoFreeze,
  setUseProxies,
  produceWithPatches,
  enablePatches,
} from 'immer';
import { create } from '../../src';
import { measure } from './measure';

const MAX = 1;

const baseState: { arr: any[]; map: Record<string, any> } = {
  arr: [],
  map: {},
};

const createTestObject = () =>
  Array(10 * 5)
    .fill(1)
    .reduce((i, _, k) => Object.assign(i, { [k]: k }), {});

baseState.arr = Array(10 ** 4 * 5)
  .fill('')
  .map(() => createTestObject());

Array(10 ** 2)
  .fill(1)
  .forEach((_, i) => {
    baseState.map[i] = { i };
  });

measure(
  'native handcrafted',
  () => baseState,
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
  'mutative - without autoFreeze',
  () => baseState,
  (baseState: any) => {
    for (let i = 0; i < MAX; i++) {
      const state = create(baseState, (draft) => {
        draft.arr.push(i);
        draft.map[i] = i;
      });
    }
  }
);

measure(
  'immer - without autoFreeze',
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

console.log('');
