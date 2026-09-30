# Local measurements: 2026-09-30

These are measurements of the current checkout's Mutative 1.3.0 production
artifact against the npm latest stable Immer 11.1.18 artifact, with
`enableArrayMethods` disabled throughout.

| Dataset      | Scope                                                             | Independent processes | Measured trials | Results                                                                                                    |
| ------------ | ----------------------------------------------------------------- | --------------------: | --------------: | ---------------------------------------------------------------------------------------------------------- |
| Default      | All 21 scenarios, 100 array rows, both freeze modes and libraries |                     3 |             252 | [Tables](./2026-09-30-m1-max-node24-default.md), [JSON](./2026-09-30-m1-max-node24-default.json)           |
| Array 1,000  | Six array scenarios, both freeze modes and libraries              |                     3 |              72 | [Tables](./2026-09-30-m1-max-node24-array-1000.md), [JSON](./2026-09-30-m1-max-node24-array-1000.json)     |
| Array 10,000 | Same six scenarios at 10,000 rows                                 |                     3 |              72 | [Tables](./2026-09-30-m1-max-node24-array-10000.md), [JSON](./2026-09-30-m1-max-node24-array-10000.json)   |
| Object order | 1,000-property insertion, freeze off, balanced library order      |                     6 |              12 | [Tables](./2026-09-30-m1-max-node24-object-order.md), [JSON](./2026-09-30-m1-max-node24-object-order.json) |

The four datasets contain **408 measured trials in 15 independent processes**.
Before timing, every selected scenario/library/freeze combination passed the
immutable reference, structural sharing, input preservation, absence of drafts in outputs,
freeze mode, and repeatability checks.

Environment: Apple M1 Max, 64 GiB RAM, macOS 26.6.2, arm64, Node 24.16.0,
V8 13.6.233.17-node.49, Mitata 1.0.34. Benchmarks were sequential, with no
concurrent test or profiling jobs. Normal desktop background activity remained
present, including BTLEServer; this was not an isolated benchmarking machine.

Each table uses the median of independent-process **mean times**, in
microseconds per complete scenario. Each JSON retains all per-process means,
percentiles, sample counts, and order. Ratios above 1 favor Mutative; ratios
below 1 favor Immer. Small differences near 1 do not establish a decisive win.
The tables also retain per-process min/max ranges; sample p99 can describe
batched samples and is not individual-request tail latency.

The default dataset was measured at `071eede`; later datasets at `9184acb`.
The intervening change compacted reporting metadata without changing the timed
path. All datasets have identical Mutative source and production artifact hashes,
and identical Immer version/artifact hashes. The default build was clean; later
build metadata records only the newly generated, untracked `perf-testing/reports/`
directory. Raw no-op calibration sample arrays were compacted to their existing
statistics and sample counts; measured scenario statistics were preserved.

## What these measurements show

- At the default 100-row size with freezing off, Immer has a lower median time
  in 18 of 21 scenarios. This is a scenario count, not an overall speed score.
- With freezing on and pre-frozen input, Mutative has a lower median in 9 of
  21 scenarios, including push, the head update, and five-item updates. Several
  differences are small or fluctuate across processes.
- Scale changes the result. At 1,000 rows, freezing-on push measures
  42.693 vs 91.679 µs (I/M 2.15). At 10,000 rows it measures
  262.822 vs 735.887 µs (I/M 2.80).
- At 10,000 rows, freezing-on five-item updates measure
  277.178 vs 743.102 µs (I/M 2.68), while full-array nested mapping with
  freezing off measures 11,660.873 vs 7,464.623 µs (I/M 0.64). Mapping here
  includes assigning the derived array; it is not a pure-read benchmark.
- The default 1,000-property insertion result is unstable: Mutative's off-mode
  mean ranges from 58.424 to 238.028 µs. Its aggregate I/M of 3.57 must not be
  treated as a stable speedup. The additional object-order dataset records
  the alternating orders explicitly.

The focused object-order run confirms the sensitivity (all times in µs):

| Process | First library | Mutative |   Immer |  I/M |
| ------- | ------------- | -------: | ------: | ---: |
| 1       | Mutative      |   60.125 | 206.822 | 3.44 |
| 2       | Immer         |  233.737 | 206.334 | 0.88 |
| 3       | Mutative      |   57.374 | 222.361 | 3.88 |
| 4       | Immer         |  230.532 | 207.440 | 0.90 |
| 5       | Mutative      |   57.832 | 207.202 | 3.58 |
| 6       | Immer         |  235.364 | 206.532 | 0.88 |

Thus the pooled I/M 1.42 from six processes also hides two distinct modes.
The mechanism was not established by these runs. Before drawing a library
choice conclusion from this object case, use separate-library process controls
(`--library mutative` and `--library immer`) and investigate JIT/fixture-shape
effects. The framework already supports these controls.

## Dimensions to add next

| Priority | Dimension                         | Concrete cases and reason                                                                                                                                                                                                                |
| -------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| High     | Pure reads and no-ops             | Traverse all draft objects with index access, `forEach`, and iteration; read only `length`; search for a missing ID; empty recipe and same-value assignments. Separate drafting/read overhead and unchanged-state detection from writes. |
| High     | Locate outside the draft          | Compare direct index updates with `find` inside the draft and searches on the original state. The current high-index update combines search, proxy creation, and writing.                                                                |
| High     | Cold and incoming-data freezing   | First update of an unfrozen large graph; pre-frozen state receiving fresh unfrozen payloads; ongoing pre-frozen updates. Current freeze-on results cover only the last case.                                                             |
| High     | Mutation density and depth        | Update 1/5/1%/10%/100% of rows, shallow vs deep paths, one recipe vs many producer calls. The five-item workload always targets low indexes.                                                                                             |
| High     | Patches                           | Patch generation and forward/inverse application for index edits, insertion/removal, and sparse updates, compared separately from plain updates. Keep array-method plugins disabled.                                                     |
| High     | Process/order controls            | Single-library worker runs and isolated scenarios. The object-order follow-up above shows that alternating orders alone does not make every pooled result stable.                                                                        |
| Medium   | Wider data and operation coverage | Edit existing object properties as well as insert/delete; `pop`, `shift`, `unshift`, middle `splice`, `fill`, `copyWithin`, randomized sorting; dense vs sparse arrays and primitive vs object elements.                                 |
| Medium   | Collections and memory            | Bring the existing `performance:set-map` workloads into this versioned framework; measure Map/Set updates/reads plus allocated bytes, retained heap, GC cost, and sustained throughput in a separate memory run.                         |
| Medium   | Engines and initialization        | Node 22 vs 24, Chrome/Firefox/Safari, module load and first call. Current results cover one Node/V8 version.                                                                                                                             |
| Lower    | Handwritten immutable baseline    | Time the already ported manual reference reducer without freezing, to show absolute abstraction overhead. It currently serves correctness validation only.                                                                               |

## Reproduce

From the repository root, rebuild with `pnpm benchmark:immer:build` after
`pnpm build`, then run:

```sh
node perf-testing/run-benchmarks.mjs --output perf-testing/results/default.json
node perf-testing/run-benchmarks.mjs --array-size 1000 --filter '^(add|remove|update-high|update-multiple|mapNested|reverse-array)$' --output perf-testing/results/array-1000.json
node perf-testing/run-benchmarks.mjs --array-size 10000 --filter '^(add|remove|update-high|update-multiple|mapNested|reverse-array)$' --output perf-testing/results/array-10000.json
node perf-testing/run-benchmarks.mjs --runs 6 --freeze off --filter '^update-largeObject1$' --output perf-testing/results/object-order.json
```

Suite validation also passed `pnpm lint`, source/test and new-tool formatting
checks, `pnpm type-check`, the Mutative build, and `pnpm test:package` with packed
consumer checks. Existing unit tests passed 40 files: 4,235 passed,
234 expected failures, and 8 skipped. The expected failures belong to existing
Immer array-method bug reproductions, which are not enabled by these benchmarks.
CPU profile source mapping was also verified with the current build map
deliberately overwritten: analysis still used the profile's saved snapshot and
resolved Mutative frames back to source. The build map was restored afterward.
