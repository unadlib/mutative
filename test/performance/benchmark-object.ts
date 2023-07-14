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

const config = {
  type: 'line',
  data: {
    labels: [],
    datasets: [
      {
        label: 'Naive handcrafted reducer',
        backgroundColor: 'rgba(255, 0, 0, 0.5)',
        borderColor: 'rgba(255, 0, 0, 0.5)',
        data: [],
      },
      {
        label: 'Mutative',
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 0.5)',
        data: [],
      },
      {
        label: 'Immer',
        backgroundColor: 'rgba(0, 255, 0, 0.5)',
        borderColor: 'rgba(0, 255, 0, 0.5)',
        data: [],
      },
    ],
  },
  options: {
    title: {
      display: true,
      text: 'Chart.js Line Chart',
    },
  },
};

const run = (size: number) => {
  config.data.labels.push(size);
  const getData = (size: number) =>
    Array(size)
      .fill(1)
      .reduce(
        (i, _, key) => Object.assign(i, { [key]: { value: key } }),
        {} as Record<string, { value: number }>
      );

  const suite = new Suite();

  let i: number;
  let baseState: Record<string, { value: number }>;

  suite
    .add(
      'Naive handcrafted reducer',
      () => {
        const state = {
          ...baseState,
          0: { value: i },
        };
      },
      {
        onStart: () => {
          i = Math.random();
          baseState = getData(size);
        },
      }
    )
    .add(
      'Mutative',
      () => {
        const state = create(baseState, (draft) => {
          draft[0].value = i;
        });
      },
      {
        onStart: () => {
          i = Math.random();
          baseState = getData(size);
        },
      }
    )
    .add(
      'Immer',
      () => {
        const state = produce(baseState, (draft: any) => {
          draft[0].value = i;
        });
      },
      {
        onStart: () => {
          i = Math.random();
          baseState = getData(size);
        },
      }
    )
    .on('cycle', (event) => {
      const data = config.data.datasets.find(
        (item) => item.label === event.target.name
      );
      data.data.push(1000 / event.target.hz);
    })
    .on('complete', function () {
      console.log(
        `Size ${size}: The fastest method is ${this.filter('fastest').map(
          'name'
        )}`
      );
    })
    .run({ async: false });
};

[
  ...Array(9)
    .fill(1)
    .map((_, i) => (i + 1) * 10 ** 2),
  ...Array(9)
    .fill(1)
    .map((_, i) => (i + 1) * 10 ** 3),
  ...Array(9)
    .fill(1)
    .map((_, i) => (i + 1) * 10 ** 4),
].forEach((value) => run(value));

try {
  const chart = new QuickChart();
  chart.setConfig(config);
  const file = fs.createWriteStream('benchmark1.jpg');
  https.get(chart.getUrl(), (response) => {
    response.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log('update benchmark1');
    });
  });
} catch (err) {
  console.error(err);
}
