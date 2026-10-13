/**
 * Shared figures for the home and performance charts, from
 * `perf-testing/reports/SUMMARY.md` and the performance page's rounded tables.
 * Keep these figures and the documentation aligned when updating a run.
 */

/** The run that the figures come from. */
export const benchmarkRun = {
  machine: 'Apple M1 Max',
  node: '24.16.0',
  immer: '11.1.18',
  workloads: 97,
};

/**
 * Geometric means of Immer's time over Mutative's, rounded to one decimal, and
 * the measured cases in which Mutative was faster.
 */
export const speedups = {
  /** Both libraries freezing or not, and both generating patches or not. */
  matched: { factor: 3.6, faster: 595, within: 13, slower: 6, cases: 614 },
  /** Mutative without auto-freeze, and Immer with it, both without patches. */
  defaults: { factor: 6.6, faster: 154, within: 0, slower: 3, cases: 157 },
};

/** Rounded geometric means from the performance page's large-array table. */
export const arraySpeedups = [
  { freeze: false, patches: false, all: [8.7, 10.8], moves: [209, 430] },
  { freeze: false, patches: true, all: [4.1, 4.5], moves: [7.1, 7.3] },
  { freeze: true, patches: false, all: [3.9, 4.2], moves: [32, 39] },
  { freeze: true, patches: true, all: [2.7, 2.8], moves: [6.6, 6.8] },
] as const;

/** Selected rows of the performance page's patches-on, freeze-off table, in µs. */
export const patchWorkloads = [
  {
    name: 'Push a row and insert a property',
    rows: '10,000',
    mutative: 63.2,
    immer: 360,
    mutativeV1: 210,
  },
  {
    name: 'Remove the first row with shift',
    rows: '10,000',
    mutative: 1063,
    immer: 8943,
    mutativeV1: 265439,
  },
  {
    name: 'Update every row',
    rows: '10,000',
    mutative: 8555,
    immer: 21767,
    mutativeV1: 22549,
  },
  {
    name: 'Update one of 10,000 records',
    rows: '10,000',
    mutative: 1184,
    immer: 2104,
    mutativeV1: 1181,
  },
] as const;

/** A workload of the home page chart, as the README's table names it. */
export interface ChartWorkload {
  /** Its name in the README's table of selected results. */
  name: string;
  /** Its size, in the column of rows of that table; `—` for none. */
  rows: string;
  /** What the chart says about its state. */
  detail: string;
  /**
   * Microseconds per update, as that table rounds them: Mutative and Immer
   * without auto-freeze, and Immer with its default auto-freeze.
   */
  mutative: string;
  immer: string;
  immerAutoFreeze: string;
}

/**
 * Four workloads of the README's table, from those in which Mutative gains
 * least over Immer to those in which it gains most.
 */
export const chartWorkloads: ChartWorkload[] = [
  {
    name: '200 RTK Query-style updates',
    rows: '—',
    detail: '100 pending and 100 resolved requests',
    mutative: '1,001',
    immer: '1,133',
    immerAutoFreeze: '4,795',
  },
  {
    name: 'Update one field of a small object',
    rows: '—',
    detail: 'A tiny plain object',
    mutative: '0.51',
    immer: '0.69',
    immerAutoFreeze: '0.95',
  },
  {
    name: 'Add a number to a Set',
    rows: '10,000',
    detail: 'A Set of 10,000 numbers',
    mutative: '29.5',
    immer: '904',
    immerAutoFreeze: '975',
  },
  {
    name: 'Remove the first row',
    rows: '10,000',
    detail: 'An array of 10,000 rows, with shift()',
    mutative: '7.04',
    immer: '7,408',
    immerAutoFreeze: '8,137',
  },
];
