/* eslint-disable prefer-template */
// @ts-nocheck
import fs from 'fs';
import { Suite } from 'benchmark';
import { parse } from 'json2csv';
import deepFreeze from 'deep-freeze';
import produce, {
  enablePatches,
  produceWithPatches,
  setAutoFreeze,
  setUseProxies,
} from 'immer';
import { create } from '../..';

const result = [
  {
    '': 'Mutative',
  },
  {
    '': 'Immer',
  },
  {
    '': 'Naive handcrafted reducer',
  },
];

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

  Array(10 ** 3)
    .fill(1)
    .forEach((_, i) => {
      baseState.map[i] = { i };
    });
  return baseState;
  // return deepFreeze(baseState);
};

let baseState: any;
let i: any;

const suite = new Suite();

suite
  .add(
    'Naive handcrafted reducer - No Freeze',
    () => {
      const state = {
        ...baseState,
        arr: [...baseState.arr, i],
        map: { ...baseState.map, [i]: { i } },
      };
    },
    {
      onStart: () => {
        i = Math.random();
        baseState = getData();
      },
    }
  )
  .add(
    'Mutative - No Freeze(by default)',
    () => {
      const state = create(baseState, (draft) => {
        draft.arr.push(i);
        draft.map[i] = i;
      });
    },
    {
      onStart: () => {
        i = Math.random();
        baseState = getData();
      },
    }
  )
  .add(
    'Immer - No Freeze',
    () => {
      const state = produce(baseState, (draft: any) => {
        draft.arr.push(i);
        draft.map[i] = i;
      });
    },
    {
      onStart: () => {
        setAutoFreeze(false);
        setUseProxies(true);
        i = Math.random();
        baseState = getData();
      },
    }
  )
  .add(
    'Mutative - Freeze',
    () => {
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
    },
    {
      onStart: () => {
        i = Math.random();
        baseState = getData();
      },
    }
  )
  .add(
    'Immer - Freeze(by default)',
    () => {
      const state = produce(baseState, (draft: any) => {
        draft.arr.push(i);
        draft.map[i] = i;
      });
    },
    {
      onStart: () => {
        setAutoFreeze(true);
        setUseProxies(true);
        i = Math.random();
        baseState = getData();
      },
    }
  )
  .add(
    'Mutative - Patches and No Freeze',
    () => {
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
    },
    {
      onStart: () => {
        i = Math.random();
        baseState = getData();
      },
    }
  )
  .add(
    'Immer - Patches and No Freeze',
    () => {
      const state = produceWithPatches(baseState, (draft: any) => {
        draft.arr.push(i);
        draft.map[i] = i;
      });
    },
    {
      onStart: () => {
        setAutoFreeze(false);
        setUseProxies(true);
        enablePatches();
        i = Math.random();
        baseState = getData();
      },
    }
  )
  .add(
    'Mutative - Patches and Freeze',
    () => {
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
    },
    {
      onStart: () => {
        i = Math.random();
        baseState = getData();
      },
    }
  )
  .add(
    'Immer - Patches and Freeze',
    () => {
      const state = produceWithPatches(baseState, (draft: any) => {
        draft.arr.push(i);
        draft.map[i] = i;
      });
    },
    {
      onStart: () => {
        setAutoFreeze(true);
        setUseProxies(true);
        enablePatches();
        i = Math.random();
        baseState = getData();
      },
    }
  )
  .on('cycle', (event) => {
    console.log(String(event.target));
    const [name] = event.target.name.split(' - ');
    const index = result.findIndex((i) => i[''] === name);
    result[index][event.target.name] = Math.round(event.target.hz);
  })
  .on('complete', function () {
    console.log('The fastest method is ' + this.filter('fastest').map('name'));
  })
  .run({ async: false });

try {
  // Mutative vs Immer Performance
  // Measure(ops/sec) to update 50K arrays and 1K objects, bigger the better.
  const fields = [];
  result.forEach((item) => {
    fields.push(...Object.keys(item).slice(1));
  });
  result.forEach((item) => {
    fields.forEach((field) => {
      if (!(field in item)) {
        item[field] = '-';
      }
    });
  });
  const csv = parse(result, {
    fields: ['', ...fields.reverse()],
  });
  fs.writeFileSync('benchmark.csv', csv);
} catch (err) {
  console.error(err);
}
