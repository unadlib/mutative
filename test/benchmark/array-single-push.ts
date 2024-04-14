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

const config: Parameters<QuickChart['setConfig']>[0] = {
  type: 'line',
  data: {
    labels: [],
    datasets: [
      {
        label: 'Mutative',
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 0.5)',
        data: [],
        fill: false,
      },
      // {
      //   label: 'Naive handcrafted reducer',
      //   backgroundColor: 'rgba(255, 0, 0, 0.5)',
      //   borderColor: 'rgba(255, 0, 0, 0.5)',
      //   data: [],
      //   fill: false,
      // },
      {
        label: 'Immer',
        backgroundColor: 'rgba(0, 255, 0, 0.5)',
        borderColor: 'rgba(0, 255, 0, 0.5)',
        data: [],
        fill: false,
      },
    ],
  },
  options: {
    title: {
      display: true,
      text: 'Mutative vs Immer performance - Array Single push()',
    },
    scales: {
      xAxes: [
        {
          display: true,
          scaleLabel: {
            display: true,
            labelString: 'Number of array items',
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
    Array(size)
      .fill(1)
      .map((_, key) => ({ value: key }));

  const suite = new Suite();

  let i: number;
  let baseState: { value: number }[];

  suite
    .add(
      'Mutative',
      () => {
        const state = create(baseState, (draft) => {
          draft.push({ value: i });
        });
      },
      {
        onStart: () => {
          i = Math.random();
          baseState = getData(size);
        },
      }
    )
    // .add(
    //   'Naive handcrafted reducer',
    //   () => {
    //     const state = [...baseState, { value: i }];
    //   },
    //   {
    //     onStart: () => {
    //       i = Math.random();
    //       baseState = getData(size);
    //     },
    //   }
    // )
    .add(
      'Immer',
      () => {
        const state = produce(baseState, (draft: any) => {
          draft.push({ value: i });
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
    .map((_, i) => (i + 1) * 10 ** 3),
  ...Array(9)
    .fill(1)
    .map((_, i) => (i + 1) * 10 ** 4),
  // ...Array(9)
  //   .fill(1)
  //   .map((_, i) => (i + 1.5) * 10 ** 4),
  // ...Array(9)
  //   .fill(1)
  //   .map((_, i) => (i + 1) * 10 ** 5),
]
  .sort((a, b) => a - b)
  .forEach((value) => run(value));

try {
  const name = path.basename(__filename).replace('.ts', '');
  const chart = new QuickChart();
  chart.setConfig(config);
  const avg =
    config.data.datasets[0].data.reduce((current, value, index) => {
      const immerValue = config.data.datasets[1].data[index];
      return current + immerValue / value;
    }, 0) / config.data.datasets[0].data.length;
  const resultPath = path.resolve(__dirname, `./results/result.json`);
  if (!fs.existsSync(resultPath)) {
    fs.writeFileSync(resultPath, '{}');
  }
  const data = JSON.parse(fs.readFileSync(resultPath));
  data[name] = { name, avg };
  fs.writeFileSync(resultPath, JSON.stringify(data, null, 2));
  const file = fs.createWriteStream(
    path.resolve(__dirname, `./results/${name}.jpg`)
  );
  https.get(chart.getUrl(), (response) => {
    response.pipe(file);
    file.on('finish', () => {
      file.close();
    });
  });
} catch (err) {
  console.error(err);
}
