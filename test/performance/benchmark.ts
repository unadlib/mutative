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
import { create } from '../../src';

const result = [];

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
    'naive handcrafted reducer',
    function () {
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
    'mutative - without autoFreeze',
    function () {
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
    'immer - without autoFreeze',
    function () {
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
    'mutative - with autoFreeze',
    function () {
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
    'immer - with autoFreeze',
    function () {
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
    'mutative - with patches',
    function () {
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
    'immer - with patches',
    function () {
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
    'mutative - with patches and autoFreeze',
    function () {
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
    'immer - with patches and autoFreeze',
    function () {
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
  .on('cycle', function (event) {
    console.log(String(event.target));
    result.push({
      'Update 50K arrays and 1K objects': event.target.name,
      'ops/sec': Math.round(event.target.hz),
    });
  })
  .on('complete', function () {
    console.log('The fastest method is ' + this.filter('fastest').map('name'));
  })
  .run({ async: false });

try {
  const csv = parse(result, {
    fields: ['Update 50K arrays and 1K objects', 'ops/sec'],
  });
  fs.writeFileSync('benchmark.csv', csv);
} catch (err) {
  console.error(err);
}
