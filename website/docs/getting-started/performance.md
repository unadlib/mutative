---
sidebar_position: 5
---

# Performance

Mutative is about 3x faster than Immer with matched settings and 6x faster with each library's defaults, across 90 benchmarked workloads. A hand-written reducer that copies only what it changes is faster still in most of them.

## Benchmark suite

The [benchmark suite](https://github.com/unadlib/mutative/tree/main/perf-testing) times 90 workloads: Immer's own performance tests, array methods, reads, Map and Set values, object records, class instances, a deep path, patch application, and returned values. It compares Mutative with Immer 11.1.18 and with reducers written by hand, after checking every result against those reducers. The [performance summary](https://github.com/unadlib/mutative/blob/main/perf-testing/reports/SUMMARY.md) has the complete results, the method, and their limits.

## Mutative vs Immer

> Mutative passed all of Immer's test cases.

With matched settings, both freezing or both not and both generating patches or both not, Mutative was faster than Immer in 508 of 530 measured cases, 3.1x on geometric mean. With each library's defaults, Mutative without auto-freeze and Immer with it, Mutative was faster in 133 of 136 cases, 6.0x on geometric mean.

Times are microseconds per update, medians of three runs on an Apple M1 Max with Node.js 24.16.0; lower is better. Mutative, the first Immer column, and the hand-written reducers run without auto-freeze; the second Immer column shows Immer's default.

| Workload | Rows | Mutative | Immer | Immer, auto-freeze | Hand-written |
| --- | ---: | ---: | ---: | ---: | ---: |
| Update one field of a small object | — | 0.65 | 1.02 | 1.32 | 0.05 |
| Update an array item found by ID | 100 | 1.33 | 1.99 | 25.9 | 0.84 |
| 200 RTK Query-style updates | — | 1,031 | 1,180 | 5,209 | 361 |
| Read every row by index | 10,000 | 5,210 | 11,253 | 11,513 | 135 |
| Remove the first row | 10,000 | 7.37 | 8,292 | 9,125 | 1.43 |
| Update every row | 10,000 | 7,008 | 12,803 | 16,454 | 243 |
| Update one of 10,000 records | 10,000 | 1,242 | 2,172 | 3,222 | 2,177 |
| Insert into a 1,000-property object | — | 53.0 | 151 | 238 | 131 |
| Update a Map value | 10,000 | 553 | 557 | 774 | 548 |
| Add a number to a Set | 10,000 | 1,013 | 1,502 | 1,605 | 72.4 |
| Update a class instance | 10,000 | 3.19 | 3.74 | 673 | 1.49 |
| Update a value ten levels deep | — | 3.70 | 4.75 | 8.27 | 0.87 |
| Apply patches to 10% of rows | 10,000 | 1,558 | 1,465 | 2,440 | — |
| Return draft.filter() | 10,000 | 2,444 | 4,188 | 4,645 | 80.2 |
| Return a new state | 10,000 | 2,914 | 8,272 | 0.89 | 0.06 |
| Return it with rawReturn() | 10,000 | 0.30 | 7,865 | 0.89 | 0.06 |

The record and 1,000-property rows ran each library in a process of its own, because code that ran earlier in a process changes how fast V8 copies such wide objects. Immer has no `rawReturn()` and returns the same plain value in the last two rows. Immer was faster in 11 of the 530 matched cases: when returning a new state built from frozen data, which Immer does not search for drafts; when applying patches that replace nested values, by 5-7%; and, with auto-freeze, when updating a class instance with 1,000 fields.

## Mutative vs hand-written reducers

A hand-written reducer that copies only what it changes is faster than any library that drafts state, and it was faster than Mutative in 109 of the suite's 129 cases. Mutative was faster when copying wide objects, such as records with 1,000 keys or class instances with 100 fields, by 1.5-2.8x with each measured in a process of its own, and when moving elements of large arrays: inserting at the front of 10,000 rows took 16 µs instead of 86 µs.

Spreads also become slow when code copies the same structure again and again. Mutative copies each object at most once per update, however many changes a recipe makes.

## Run the benchmarks

From a clone of the repository:

```sh
pnpm install --frozen-lockfile
pnpm benchmark:immer:check
pnpm benchmark:immer
```

The [benchmark guide](https://github.com/unadlib/mutative/blob/main/perf-testing/README.md) describes the workloads, options, memory measurements, and CI regression budgets.
