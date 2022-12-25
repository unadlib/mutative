// @ts-nocheck
'use strict';

import produce, {
  setAutoFreeze,
  setUseProxies,
  produceWithPatches,
  enablePatches,
} from 'immer';
import { create } from '../../src';
import { measure } from './measure';

const MAX = 1;

const getData = () => {
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
  return baseState;
};

measure(
  'naive handcrafted reducer',
  () => getData(),
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
  () => getData(),
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
    return getData();
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

console.log('------------------');

measure(
  'mutative - with autoFreeze',
  () => getData(),
  (baseState: any) => {
    for (let i = 0; i < MAX; i++) {
      const state = create(
        baseState,
        (draft) => {
          draft.arr.push(i);
          draft.map[i] = i;
        },
        {
          enableAutoFreeze: true,
          enablePatches: false,
        }
      );
    }
  }
);

measure(
  'immer - with autoFreeze',
  () => {
    setAutoFreeze(true);
    setUseProxies(true);
    return getData();
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

console.log('------------------');

measure(
  'mutative - with patches',
  () => getData(),
  (baseState: any) => {
    for (let i = 0; i < MAX; i++) {
      const state = create(
        baseState,
        (draft) => {
          draft.arr.push(i);
          draft.map[i] = i;
        },
        {
          enableAutoFreeze: false,
          enablePatches: true,
        }
      );
    }
  }
);

measure(
  'immer - with patches',
  () => {
    setAutoFreeze(false);
    setUseProxies(true);
    enablePatches();
    return getData();
  },
  (baseState: any) => {
    for (let i = 0; i < MAX; i++) {
      const state = produceWithPatches(baseState, (draft: any) => {
        draft.arr.push(i);
        draft.map[i] = i;
      });
    }
  }
);

console.log('------------------');

measure(
  'mutative - with autoFreeze and patches',
  () => getData(),
  (baseState: any) => {
    for (let i = 0; i < MAX; i++) {
      const state = create(
        baseState,
        (draft) => {
          draft.arr.push(i);
          draft.map[i] = i;
        },
        {
          enableAutoFreeze: true,
          enablePatches: true,
        }
      );
    }
  }
);

measure(
  'immer - with autoFreeze and patches',
  () => {
    setAutoFreeze(true);
    setUseProxies(true);
    enablePatches();
    return getData();
  },
  (baseState: any) => {
    for (let i = 0; i < MAX; i++) {
      const state = produceWithPatches(baseState, (draft: any) => {
        draft.arr.push(i);
        draft.map[i] = i;
      });
    }
  }
);

console.log('');
