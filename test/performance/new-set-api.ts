/* eslint-disable import/no-relative-packages */
/* eslint-disable prefer-template */
// @ts-nocheck
import fs from 'fs';
import path from 'path';
import https from 'https';
import { Suite } from 'benchmark';
import { parse } from 'json2csv';
import deepFreeze from 'deep-freeze';
import QuickChart from 'quickchart-js';

const config: Parameters<QuickChart['setConfig']>[0] = {
  type: 'line',
  data: {
    labels: [],
    datasets: [
      // {
      //   label: 'Set - shallow copy with iteration',
      //   backgroundColor: 'rgba(54, 162, 235, 0.5)',
      //   borderColor: 'rgba(54, 162, 235, 0.5)',
      //   data: [],
      //   fill: false,
      // },
      {
        label: 'Set - shallow copy with values()',
        backgroundColor: 'rgba(255, 0, 0, 0.5)',
        borderColor: 'rgba(255, 0, 0, 0.5)',
        data: [],
        fill: false,
      },
      {
        label: 'Set - shallow copy with difference()',
        backgroundColor: 'rgba(0, 255, 0, 0.5)',
        borderColor: 'rgba(0, 255, 0, 0.5)',
        data: [],
        fill: false,
      },
      // {
      //   label: 'Set - shallow copy with symmetricDifference()',
      //   backgroundColor: 'rgba(255, 151, 160, 0.5)',
      //   borderColor: 'rgba(255, 151, 160, 0.5)',
      //   data: [],
      //   fill: false,
      // },
      // {
      //   label: 'Set - shallow copy with union()',
      //   backgroundColor: 'rgba(187, 0, 255, 0.5)',
      //   borderColor: 'rgba(187, 0, 255, 0.5)',
      //   data: [],
      //   fill: false,
      // },
    ],
  },
  options: {
    title: {
      display: true,
      text: 'performance - Set shallow copy',
    },
    scales: {
      xAxes: [
        {
          display: true,
          scaleLabel: {
            display: true,
            labelString: 'Number of set items',
          },
        },
      ],
      yAxes: [
        {
          display: true,
          scaleLabel: {
            display: true,
            labelString: 'Measure(seconds), lower is better',
          },
        },
      ],
    },
  },
};

const run = (size: number) => {
  config.data.labels.push(size);
  const getData = (size: number) =>
    new Set(
      Array(size)
        .fill(1)
        .map((_, key) => ({ value: key }))
    );

  const suite = new Suite();

  let i: number;
  let baseState: Set<{ value: number }>;

  suite
    // .add(
    //   'Set - shallow copy with iteration',
    //   () => {
    //     const state = new Set();
    //     for (const item of baseState) {
    //       state.add(item);
    //     }
    //   },
    //   {
    //     onStart: () => {
    //       i = Math.random();
    //       baseState = getData(size);
    //     },
    //   }
    // )
    .add(
      'Set - shallow copy with values()',
      () => {
        const state = new Set(baseState.values());
      },
      {
        onStart: () => {
          i = Math.random();
          baseState = getData(size);
        },
      }
    )
    .add(
      'Set - shallow copy with difference()',
      () => {
        const state = Set.prototype.difference.call(baseState, new Set());
      },
      {
        onStart: () => {
          i = Math.random();
          baseState = getData(size);
        },
      }
    )
    // .add(
    //   'Set - shallow copy with symmetricDifference()',
    //   () => {
    //     const state = baseState.symmetricDifference(new Set());
    //   },
    //   {
    //     onStart: () => {
    //       i = Math.random();
    //       baseState = getData(size);
    //     },
    //   }
    // )
    // .add(
    //   'Set - shallow copy with union()',
    //   () => {
    //     const state = baseState.union(new Set());
    //   },
    //   {
    //     onStart: () => {
    //       i = Math.random();
    //       baseState = getData(size);
    //     },
    //   }
    // )
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
  // ...Array(9)
  //   .fill(1)
  //   .map((_, i) => (i + 1) * 10 ** 3),
  ...Array(9)
    .fill(1)
    .map((_, i) => (i + 1) * 10 ** 4),
  ...Array(9)
    .fill(1)
    .map((_, i) => (i + 1.5) * 10 ** 4),
  ...Array(9)
    .fill(1)
    .map((_, i) => (i + 1) * 10 ** 5),
]
  .sort((a, b) => a - b)
  .forEach((value) => run(value));

try {
  const chart = new QuickChart();
  chart.setConfig(config);
  const file = fs.createWriteStream(path.resolve(__dirname, `new-set-api.jpg`));
  https.get(chart.getUrl(), (response) => {
    response.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log('update new-set-api');
    });
  });
} catch (err) {
  console.error(err);
}
