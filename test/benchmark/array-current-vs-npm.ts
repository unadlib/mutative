/// <reference path="../../global.d.ts" />

/* eslint-disable import/no-dynamic-require */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable prefer-template */
// @ts-nocheck
import fs from 'fs';
import os from 'os';
import path from 'path';
import https from 'https';
import { execFileSync } from 'child_process';
import { Suite } from 'benchmark';
import QuickChart from 'quickchart-js';

(global as any).__DEV__ = false;
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

const currentPackagePath = path.resolve(__dirname, '../../dist/index.js');
const useCurrentDist = process.env.MUTATIVE_BENCH_USE_DIST !== 'false';
if (useCurrentDist && !fs.existsSync(currentPackagePath)) {
  throw new Error(
    `Cannot find current build at ${currentPackagePath}. Run yarn build first, or set MUTATIVE_BENCH_USE_DIST=false to compare workspace source.`
  );
}
const currentPackage = useCurrentDist
  ? require(currentPackagePath)
  : require('../../src');
const currentVersion = require('../../package.json').version;
const currentCreate = currentPackage.create;

const npmSpec = process.env.MUTATIVE_NPM_SPEC || 'mutative@latest';

function installNpmMutative(spec: string) {
  const tempDir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'mutative-npm-benchmark-')
  );
  execFileSync(
    'npm',
    ['install', '--prefix', tempDir, '--no-save', '--silent', spec],
    {
      stdio: 'inherit',
    }
  );
  const packageDir = path.join(tempDir, 'node_modules', 'mutative');
  const packageJson = require(path.join(packageDir, 'package.json'));
  const module = require(packageDir);
  process.on('exit', () => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });
  return {
    create: module.create,
    version: packageJson.version,
  };
}

const npmMutative = installNpmMutative(npmSpec);

const config: Parameters<QuickChart['setConfig']>[0] = {
  type: 'horizontalBar',
  data: {
    labels: [],
    datasets: [
      {
        label: `Current ${useCurrentDist ? 'dist' : 'workspace'} v${currentVersion}`,
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgb(54, 162, 235)',
        borderWidth: 1,
        data: [],
      },
      {
        label: `npm ${npmSpec} resolved v${npmMutative.version}`,
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        borderColor: 'rgb(255, 99, 132)',
        borderWidth: 1,
        data: [],
      },
      {
        label: 'Array spread reducer',
        backgroundColor: 'rgba(75, 192, 123, 0.5)',
        borderColor: 'rgb(75, 192, 123)',
        borderWidth: 1,
        data: [],
      },
    ],
  },
  options: {
    title: {
      display: true,
      text: 'Current Mutative vs npm Mutative vs Array spread reducer - Array operations',
    },
    scales: {
      xAxes: [
        {
          display: true,
          scaleLabel: {
            display: true,
            labelString: 'Measure(ms/op), lower is better',
          },
        },
      ],
      yAxes: [
        {
          type: 'category',
          position: 'left',
          display: true,
          scaleLabel: {
            display: true,
            labelString: 'Array operation and size',
          },
        },
      ],
    },
  },
};

const getData = (size: number) =>
  Array(size)
    .fill(1)
    .map((_, key) => ({ value: key }));

const scenarios = [
  {
    name: 'shift remove first item',
    mutate(draft: { value: number }[]) {
      draft.shift();
    },
    reduce(state: { value: number }[]) {
      return [...state.slice(1)];
    },
  },
  {
    name: 'unshift insert first item',
    mutate(draft: { value: number }[], value: number) {
      draft.unshift({ value });
    },
    reduce(state: { value: number }[], value: number) {
      return [{ value }, ...state];
    },
  },
  {
    name: 'splice move first item',
    mutate(draft: { value: number }[], value: number) {
      const [item] = draft.splice(0, 1);
      item.value = value;
      draft.splice(draft.length, 0, item);
    },
    reduce(state: { value: number }[], value: number) {
      const [item, ...rest] = state;
      return [...rest, { ...item, value }];
    },
  },
  {
    name: 'reverse then update first',
    mutate(draft: { value: number }[], value: number) {
      draft.reverse();
      draft[0].value = value;
    },
    reduce(state: { value: number }[], value: number) {
      const reversed = [...state].reverse();
      return [{ ...reversed[0], value }, ...reversed.slice(1)];
    },
  },
];

const sizes = (process.env.MUTATIVE_BENCH_SIZES || '1000,10000,50000')
  .split(',')
  .map((value) => Number(value.trim()))
  .filter((value) => Number.isFinite(value) && value > 1);

const benchmarkOptions = {
  minSamples: Number(process.env.MUTATIVE_BENCH_MIN_SAMPLES || 20),
  minTime: Number(process.env.MUTATIVE_BENCH_MIN_TIME || 0.05),
};

function assertSameResult(
  scenario: (typeof scenarios)[number],
  size: number,
  value: number
) {
  const baseState = getData(size);
  const currentState = currentCreate(baseState, (draft: any) => {
    scenario.mutate(draft, value);
  });
  const npmState = npmMutative.create(baseState, (draft: any) => {
    scenario.mutate(draft, value);
  });
  const reducerState = scenario.reduce(baseState, value);
  const currentString = JSON.stringify(currentState);
  if (
    currentString !== JSON.stringify(npmState) ||
    currentString !== JSON.stringify(reducerState)
  ) {
    throw new Error(
      `Current, npm, and array spread reducer results are different: ${scenario.name}, size ${size}`
    );
  }
}

function pushMeasure(name: string, ms: number) {
  const data = config.data.datasets.find((item) => item.label === name);
  data.data.push(ms);
}

function run(scenario: (typeof scenarios)[number], size: number) {
  const label = `${scenario.name} (${size})`;
  config.data.labels.push(label);
  assertSameResult(scenario, Math.min(size, 100), 42);

  const suite = new Suite();
  let value: number;
  let baseState: { value: number }[];

  const currentLabel = config.data.datasets[0].label;
  const npmLabel = config.data.datasets[1].label;
  const reducerLabel = config.data.datasets[2].label;

  suite
    .add(
      currentLabel,
      () => {
        currentCreate(baseState, (draft: any) => {
          scenario.mutate(draft, value);
        });
      },
      {
        ...benchmarkOptions,
        onStart: () => {
          value = Math.random();
          baseState = getData(size);
        },
      }
    )
    .add(
      npmLabel,
      () => {
        npmMutative.create(baseState, (draft: any) => {
          scenario.mutate(draft, value);
        });
      },
      {
        ...benchmarkOptions,
        onStart: () => {
          value = Math.random();
          baseState = getData(size);
        },
      }
    )
    .add(
      reducerLabel,
      () => {
        scenario.reduce(baseState, value);
      },
      {
        ...benchmarkOptions,
        onStart: () => {
          value = Math.random();
          baseState = getData(size);
        },
      }
    )
    .on('cycle', (event) => {
      const ms = 1000 / event.target.hz;
      pushMeasure(event.target.name, ms);
      console.log(`${label} - ${event.target.name}: ${ms.toFixed(4)} ms/op`);
    })
    .on('complete', function () {
      console.log(
        `${label}: The fastest method is ${this.filter('fastest').map('name')}`
      );
    })
    .run({ async: false });
}

for (const scenario of scenarios) {
  sizes.forEach((size) => run(scenario, size));
}

if (process.env.MUTATIVE_BENCH_WRITE_RESULTS !== 'false') {
  const name = path.basename(__filename).replace('.ts', '');
  const currentData = config.data.datasets[0].data;
  const npmData = config.data.datasets[1].data;
  const reducerData = config.data.datasets[2].data;
  const avg =
    currentData.reduce((current, value, index) => {
      return current + npmData[index] / value;
    }, 0) / currentData.length;
  const arraySpreadReducerAvg =
    currentData.reduce((current, value, index) => {
      return current + reducerData[index] / value;
    }, 0) / currentData.length;

  const resultsDir = path.resolve(__dirname, './results');
  fs.mkdirSync(resultsDir, { recursive: true });
  const resultPath = path.resolve(resultsDir, 'result.json');
  if (!fs.existsSync(resultPath)) {
    fs.writeFileSync(resultPath, '{}');
  }
  const data = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
  data[name] = {
    name,
    avg,
    arraySpreadReducerAvg,
    current: `${useCurrentDist ? 'dist' : 'workspace'}@${currentVersion}`,
    npm: `${npmSpec} resolved v${npmMutative.version}`,
    arraySpreadReducer: 'Array spread reducer',
  };
  fs.writeFileSync(resultPath, JSON.stringify(data, null, 2));

  const chart = new QuickChart();
  chart.setConfig(config);
  const file = fs.createWriteStream(path.resolve(resultsDir, `${name}.jpg`));
  https.get(chart.getUrl(), (response) => {
    response.pipe(file);
    file.on('finish', () => {
      file.close();
    });
  });
}
