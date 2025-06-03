// @ts-nocheck
'use strict';
(globalThis as any).__DEV__ = false;

import {
  produce,
  setAutoFreeze,
  produceWithPatches,
  enablePatches,
  enableMapSet,
} from 'immer';
import { create } from '../..';
import { measure } from '../__immer_performance_tests__/measure';
// TODO [performance] use minified version for benchmarks and performance tests. Apparently as it worked sometime without __DEV__ being defined and indicated by setting NODE_ENV=production, this probably already happened sometime but was broken since?

const MAX = 10;

const getData = () => {
  const baseState = {
    set: new Set(
      Array(10 ** 4 * 5)
        .fill('')
        .map((_, i) => ({ [i]: i }))
    ),
    map: new Map(
      Array(10 ** 4 * 5)
        .fill('')
        .map((_, i) => [{ [i]: i }, { [i]: i }])
    ),
  };
  return baseState;
};

interface BaseState {
  set: Set<{
    [x: number]: number;
  }>;
  map: Map<
    {
      [x: number]: number;
    },
    {
      [x: number]: number;
    }
  >;
}

enableMapSet();

measure(
  'naive handcrafted reducer',
  () => getData(),
  (baseState: BaseState) => {
    for (let i = 0; i < MAX; i++) {
      const state = {
        ...baseState,
        arr: new Set([...baseState.set.values(), { [i]: i }]),
        map: new Map([...baseState.map.entries(), [{ [i]: i }, { [i]: i }]]),
      };
    }
  }
);

measure(
  'mutative - without autoFreeze',
  () => getData(),
  (baseState: BaseState) => {
    for (let i = 0; i < MAX; i++) {
      const state = create(baseState, (draft) => {
        draft.set.add({ [i]: i });
        draft.map.set({ [i]: i }, { [i]: i });
      });
    }
  }
);

measure(
  'immer - without autoFreeze',
  () => {
    setAutoFreeze(false);

    return getData();
  },
  (baseState: BaseState) => {
    for (let i = 0; i < MAX; i++) {
      const state = produce(baseState, (draft) => {
        draft.set.add({ [i]: i });
        draft.map.set({ [i]: i }, { [i]: i });
      });
    }
  }
);

console.log('');

measure(
  'mutative - with autoFreeze',
  () => getData(),
  (baseState: BaseState) => {
    for (let i = 0; i < MAX; i++) {
      const state = create(
        baseState,
        (draft) => {
          draft.set.add({ [i]: i });
          draft.map.set({ [i]: i }, { [i]: i });
        },
        {
          enableAutoFreeze: true,
        }
      );
    }
  }
);

measure(
  'immer - with autoFreeze',
  () => {
    setAutoFreeze(true);

    return getData();
  },
  (baseState: BaseState) => {
    for (let i = 0; i < MAX; i++) {
      const state = produce(baseState, (draft) => {
        draft.set.add({ [i]: i });
        draft.map.set({ [i]: i }, { [i]: i });
      });
    }
  }
);

console.log('');

measure(
  'mutative - with autoFreeze and patches',
  () => getData(),
  (baseState: BaseState) => {
    for (let i = 0; i < MAX; i++) {
      const state = create(
        baseState,
        (draft) => {
          draft.set.add({ [i]: i });
          draft.map.set({ [i]: i }, { [i]: i });
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

    enablePatches();
    return getData();
  },
  (baseState: BaseState) => {
    for (let i = 0; i < MAX; i++) {
      const state = produceWithPatches(baseState, (draft) => {
        draft.set.add({ [i]: i });
        draft.map.set({ [i]: i }, { [i]: i });
      });
    }
  }
);

console.log('-------');

measure(
  'mutative - single - without autoFreeze',
  () => getData(),
  (baseState: BaseState) => {
    const state = create(baseState, (draft) => {
      for (let i = 0; i < MAX; i++) {
        draft.set.add({ [i]: i });
        draft.map.set({ [i]: i }, { [i]: i });
      }
    });
  }
);

measure(
  'immer - single - without autoFreeze',
  () => {
    setAutoFreeze(false);
    return getData();
  },
  (baseState: BaseState) => {
    const state = produce(baseState, (draft) => {
      for (let i = 0; i < MAX; i++) {
        draft.set.add({ [i]: i });
        draft.map.set({ [i]: i }, { [i]: i });
      }
    });
  }
);

console.log('');

measure(
  'mutative - single - with autoFreeze',
  () => getData(),
  (baseState: BaseState) => {
    const state = create(
      baseState,
      (draft) => {
        for (let i = 0; i < MAX; i++) {
          draft.set.add({ [i]: i });
          draft.map.set({ [i]: i }, { [i]: i });
        }
      },
      {
        enableAutoFreeze: true,
      }
    );
  }
);

measure(
  'immer - single - with autoFreeze',
  () => {
    setAutoFreeze(true);

    return getData();
  },
  (baseState: BaseState) => {
    const state = produce(baseState, (draft) => {
      for (let i = 0; i < MAX; i++) {
        draft.set.add({ [i]: i });
        draft.map.set({ [i]: i }, { [i]: i });
      }
    });
  }
);

console.log('');

measure(
  'mutative - single - with patches',
  () => getData(),
  (baseState: BaseState) => {
    const state = create(
      baseState,
      (draft) => {
        for (let i = 0; i < MAX; i++) {
          draft.set.add({ [i]: i });
          draft.map.set({ [i]: i }, { [i]: i });
        }
      },
      {
        enablePatches: true,
      }
    );
  }
);

measure(
  'immer - single - with patches',
  () => {
    setAutoFreeze(false);

    enablePatches();
    return getData();
  },
  (baseState: BaseState) => {
    const state = produceWithPatches(baseState, (draft) => {
      for (let i = 0; i < MAX; i++) {
        draft.set.add({ [i]: i });
        draft.map.set({ [i]: i }, { [i]: i });
      }
    });
  }
);

console.log('');

measure(
  'mutative - single - with autoFreeze and patches',
  () => getData(),
  (baseState: BaseState) => {
    const state = create(
      baseState,
      (draft) => {
        for (let i = 0; i < MAX; i++) {
          draft.set.add({ [i]: i });
          draft.map.set({ [i]: i }, { [i]: i });
        }
      },
      {
        enableAutoFreeze: true,
        enablePatches: true,
      }
    );
  }
);

measure(
  'immer - single - with autoFreeze and patches',
  () => {
    setAutoFreeze(true);
    enablePatches();
    return getData();
  },
  (baseState: BaseState) => {
    const state = produceWithPatches(baseState, (draft) => {
      for (let i = 0; i < MAX; i++) {
        draft.set.add({ [i]: i });
        draft.map.set({ [i]: i }, { [i]: i });
      }
    });
  }
);
