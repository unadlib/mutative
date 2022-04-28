import produce, {
  setAutoFreeze,
  setUseProxies,
  produceWithPatches,
  enablePatches,
  enableMapSet,
} from 'immer';
import { create } from '../../src';
import { measure } from './measure';

const MAX = 1000;

const baseState = {
  set: new Set(
    Array(10 ** 3)
      .fill('')
      .map((_, i) => ({ [i]: i }))
  ),
  map: new Map(
    Array(10 ** 3)
      .fill('')
      .map((_, i) => [{ [i]: i }, { [i]: i }])
  ),
};

type BaseState = typeof baseState;

enableMapSet();

measure(
  'native handcrafted',
  () => baseState,
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
  () => baseState,
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
    setUseProxies(true);
    return baseState;
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
  () => baseState,
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
    setUseProxies(true);
    return baseState;
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
  () => baseState,
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
    setUseProxies(true);
    enablePatches();
    return baseState;
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
  () => baseState,
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
    setUseProxies(true);
    return baseState;
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
  () => baseState,
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
    setUseProxies(true);
    return baseState;
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
  'mutative - single - with autoFreeze and patches',
  () => baseState,
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
    setUseProxies(true);
    enablePatches();
    return baseState;
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
