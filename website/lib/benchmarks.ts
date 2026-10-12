/**
 * The benchmark figures of the home page, which a new benchmark run updates
 * here alone. They come from the performance summary of the repository,
 * `perf-testing/reports/SUMMARY.md`, and the tests of the repository check
 * them against it.
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
  matched: { factor: 3.6, faster: 595, cases: 614 },
  /** Mutative without auto-freeze, and Immer with it, both without patches. */
  defaults: { factor: 6.6, faster: 154, cases: 157 },
};
