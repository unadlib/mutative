/* eslint-disable import/no-relative-packages */
/* eslint-disable prefer-template */
// @ts-nocheck
import fs from 'fs';
import https from 'https';
import { Suite } from 'benchmark';
import { parse } from 'json2csv';
import deepFreeze from 'deep-freeze';
import QuickChart from 'quickchart-js';
import {
  produce,
  enablePatches,
  produceWithPatches,
  setAutoFreeze,
} from 'immer';
// import {
//   produce,
//   enablePatches,
//   produceWithPatches,
//   setAutoFreeze,
// } from '../../../temp/immer/dist';
import { create } from '../..';

const labels = [];
const result = [
  {
    label: 'Mutative',
    backgroundColor: 'rgba(54, 162, 235, 0.5)',
    data: [],
  },
  {
    label: 'Immer',
    backgroundColor: 'rgba(0, 255, 0, 0.5)',
    data: [],
  },
  {
    label: 'Naive handcrafted reducer',
    backgroundColor: 'rgba(255, 0, 0, 0.5)',
    data: [],
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
    'Mutative - No Freeze',
    () => {
      const state = create(baseState, (draft) => {
        draft.arr.push(i);
        draft.map[i] = { i };
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
        draft.map[i] = { i };
      });
    },
    {
      onStart: () => {
        setAutoFreeze(false);
        //
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
          draft.map[i] = { i };
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
    'Immer - Freeze',
    () => {
      const state = produce(baseState, (draft: any) => {
        draft.arr.push(i);
        draft.map[i] = { i };
      });
    },
    {
      onStart: () => {
        setAutoFreeze(true);
        //
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
          draft.map[i] = { i };
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
        draft.map[i] = { i };
      });
    },
    {
      onStart: () => {
        setAutoFreeze(false);
        //
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
          draft.map[i] = { i };
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
        draft.map[i] = { i };
      });
    },
    {
      onStart: () => {
        setAutoFreeze(true);
        //
        enablePatches();
        i = Math.random();
        baseState = getData();
      },
    }
  )
  .on('cycle', (event) => {
    console.log(String(event.target));
    const [name, field] = event.target.name.split(' - ');
    if (name === 'Immer') console.log();
    if (!labels.includes(field)) labels.push(field);
    const item = result.find(({ label }) => label === name);
    item.data[labels.indexOf(field)] = Math.round(event.target.hz);
  })
  .on('complete', function () {
    console.log('The fastest method is ' + this.filter('fastest').map('name'));
  })
  .run({ async: false });

try {
  const config = {
    type: 'horizontalBar',
    data: {
      labels,
      datasets: result,
    },
    options: {
      title: {
        display: true,
        text: 'Mutative vs Immer Performance',
      },
      legend: {
        position: 'bottom',
      },
      elements: {
        rectangle: {
          borderWidth: 1,
        },
      },
      scales: {
        xAxes: [
          {
            display: true,
            scaleLabel: {
              display: true,
              fontSize: 10,
              labelString:
                'Measure(ops/sec) to update 50K arrays and 1K objects, bigger is better.',
            },
          },
        ],
      },
      plugins: {
        datalabels: {
          anchor: 'center',
          align: 'center',
          font: {
            size: 8,
          },
        },
      },
    },
  };
  const chart = new QuickChart();
  chart.setConfig(config);
  const file = fs.createWriteStream('benchmark.jpg');
  https.get(chart.getUrl(), (response) => {
    response.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log('update benchmark');
    });
  });
} catch (err) {
  console.error(err);
}
