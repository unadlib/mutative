# Native array methods: performance summary

Measurements from 2026-10-03 UTC for [PR #75](https://github.com/unadlib/mutative/pull/75)
at source `363b3da`, the native array methods under their data-array contract.
The candidate and pinned npm baseline both report Mutative 1.3.0; the candidate
contains unreleased source changes, including the draft fast paths from
[PR #174](https://github.com/unadlib/mutative/pull/174). Immer is pinned to
11.1.18 and Mitata to 1.0.34. The main comparison runs Immer without its
array-method plugin; a separate dataset below enables `enableArrayMethods`
through the harness option `--immer-array-methods`. Mutative's native array
methods need no option. The raw datasets of this batch were not archived; the
identities and commands below reproduce them, and the
[archive index](./README.md) describes the retention policy for batches that are.

## Follow-up: receiver cache release

Review found that the receiver cache kept a failed producer's state alive.
`create` revokes drafts when the recipe throws and when a producer finishes,
but not when an error is raised after the recipe returned: returning a value
after changing the draft, returning a modified child draft, or the async
variants of both. A draft of `create(base)` without a recipe that is never
finalized has no end at all. The module-level reference to the last array then
kept the whole state reachable until another array's method was read, while
`main` collects it on every path.

Source `8fe0d9a` releases that reference whenever a producer ends, normally or
by an error, and registers drafts of `create` without a recipe only in the
WeakSet. `test/array-methods-retention.test.ts` forces full collections and
checks six ways a producer can end; before the fix, four of them kept the state.

A harness A/B against `363b3da`, two passes each with freeze and patches off,
measured 100-row array operations 0–2% slower, about 0.01 µs, and 10,000-row
operations within 1%. The tables below remain the archive of `363b3da`.

## Contract

The fast paths are made for data arrays. On them, values, own-property
presence and patch replay match plain JS on a copy, and drafts, strict mode
and unchanged calls behave as on the proxy path:

- `shift`, `unshift`, `splice` and `reverse` run natively on the draft's copy
  of a plain array without holes. Elements that are `undefined` are ordinary
  values and move natively. A hole reads as `undefined`, so an array in which
  the `includes` builtin finds no `undefined` has none; only arrays that hold
  `undefined` are checked index by index with the `in` operator, the
  HasProperty check of the native algorithms. The result is cached per draft
  until a length change or an assignment past the end.
- `indexOf`, `lastIndexOf` and `includes` run natively on the current array and
  compare by reference, as the proxy path does: an element that has been read
  is found by its draft, one that has not by its original object. The search
  never reads a property of the value it is given.
- `sort` and `join` run natively on arrays of primitives.
- Removed elements are returned as drafts, patches replay in both directions,
  and a call that changes nothing keeps the state. Calls that cannot change the
  array (`unshift()` without arguments, `reverse()` of one element, an empty
  `splice`) are settled before any element is read or copied, and a `splice`
  that replaces elements with equal values reads only the replaced range.
- A method recognizes its receiver by identity: the array whose method was
  read last, or an array of a live producer registered when another array's
  method was read after it. A borrowed method called on any other object runs
  the native method on it without reading a property first. The reference to
  the last array is released when its producer ends, by any path, and drafts
  of `create` without a recipe are only registered weakly.
- Sparse arrays, array subclasses, an own `constructor` or
  `Symbol.isConcatSpreadable`, arrays under a custom `mark`, every method with a
  callback, `at`, `slice`, `fill` and `copyWithin` use the proxy path. An
  argument that can run user code is converted on the proxy path, so a
  conversion that changes the array is observed as the native methods do.
- Index accessors are outside the contract: their values are read as data, and
  the number and order of getter calls, their re-entrant effects on the draft,
  and the identity of objects they return are not guaranteed to match
  element-by-element execution through the proxy. Plain JS on a copy is the
  reference for every supported input; the proxy path itself is not, because it
  turns `delete` into an `undefined` assignment.

Behavior changes against the previously pushed PR head `3125fe7`: searches no
longer match a draft's original object (`draft.list.indexOf(draft.shared)`
returns -1, as through the proxy); arrays holding `undefined` take the native
path; arguments that can run user code, an own `constructor` or
`Symbol.isConcatSpreadable`, and calls on foreign receivers take the proxy
path; and a moved shared element emits patches only for its current index.
The intermediate local commits `c598b41`–`a1e3235` also routed arrays with
index accessors to the proxy path through a property-descriptor scan; the
contract replaces that scan and keeps their other fixes.

## Scope and results

Apple M1 Max, 64 GiB RAM, darwin/arm64 (kernel 25.6.0), Node 24.16.0,
V8 13.6.233.17-node.49. Jobs ran sequentially with normal desktop activity.
The suite covers 67 scenarios at 100 rows and nine scaling scenarios at 1,000
and 10,000 rows, each with both freeze and patch modes: 3,060 timing trials in
9 processes and 504 isolated memory workers. A separate six-process control
checks wide-object insertion order effects.

Each timing cell is one scenario, size, and mode. The comparison uses medians of
three independent-process means; a candidate time below 95% of the comparator
is faster, above 105% is slower, and otherwise is within the 5% band.

| Comparator | Faster / within 5% / slower, out of 340 cells | Geometric mean comparator/candidate |
| --- | ---: | ---: |
| Pinned Immer 11.1.18, plugin off | 339 / 1 / 0 | 3.77 |
| Pinned npm Mutative 1.3.0 | 335 / 4 / 1 | 5.48 |
| Previous PR head `6193657` (2026-10-02 archive) | 5 / 323 / 12 | 1.00 |
| Archived 2026-10-01 candidate (PR #174) | 140 / 191 / 9 | 2.24 |

Over the 216 array-related cells (array method scenarios, `add`, `remove`,
`filter`, `concat`, `mapNested`, `update-multiple`, `sortById-reverse`,
`reverse-array`, and the `remove*-reuse` sequences) the geometric mean of Immer
time over candidate time is 6.21; over the other 124 cells it is 1.58.
Against the previous PR head the array cells measure 1.00 and the other
cells 1.00, so the contract keeps the earlier gains.

Selected times below are microseconds per complete scenario, with freeze off.
Scenario counts are not an application-weighted performance score.

| Scenario | Rows | Patches | Candidate | Previous PR head | Pinned v1 | Immer |
| --- | ---: | --- | ---: | ---: | ---: | ---: |
| small-object-update | — | off | 0.654 | 0.640 | 1.126 | 0.875 |
| read-index | 100 | off | 49.593 | 49.680 | 77.402 | 95.831 |
| rtkq-sequence | — | off | 1,051.604 | 1,048.312 | 1,797.029 | 1,198.278 |
| sortById-reverse | 100 | off | 55.278 | 54.639 | 101.485 | 73.283 |
| array-shift-nested | 100 | off | 0.831 | 0.802 | 86.601 | 71.493 |
| array-splice-insert-nested | 1,000 | off | 5.142 | 5.196 | 420.345 | 365.222 |
| array-shift-nested | 10,000 | off | 7.441 | 7.494 | 8,947.050 | 8,117.582 |
| array-unshift-nested | 10,000 | off | 16.183 | 16.074 | 8,998.492 | 8,203.816 |
| array-splice-insert-nested | 10,000 | off | 21.424 | 21.653 | 4,343.785 | 3,967.784 |
| array-reverse-nested | 10,000 | off | 14.130 | 14.243 | 9,382.749 | 8,333.950 |
| array-reverse-nested | 10,000 | on | 1,220.700 | 1,220.189 | 282,397.320 | 10,005.183 |
| array-reverse-primitive | 10,000 | off | 14.109 | 14.195 | 4,245.941 | 4,346.116 |
| read-index | 10,000 | off | 5,244.479 | 5,273.611 | 7,982.587 | 9,911.318 |

Sampled allocation is lower than pinned v1 in 55 of 56 memory cells. The exception is `noop-empty` with freeze and patches off (3.7 vs 3.6 KiB), where both libraries allocate about 3.5–4 KiB per iteration. For nested reverse at 10,000 rows with freeze off, allocation is about 88.1 KiB/iteration without patches (11,113.5 KiB for pinned v1, 12,806.8 KiB for Immer) and about 3,034.1 KiB with patches (268,277.3 KiB for v1, 14,833.1 KiB for Immer); retained output with patches is about 1,797.4 versus 9,890.9 KiB for v1.

### Paired performance budget

The local budget gate compared this source with `main` (`1004d65`) at 1,000 rows on the same machine before the timing datasets. All 48 decisions passed: five latency pairs and three memory pairs per cell, both freeze and patch modes. Paired candidate/base median ratios span 0.003–1.017 for latency, 0.017–1.007 for sampled allocation, and 0.998–1.000 for retained heap.

## Immer with `enableArrayMethods`

The plugin datasets rerun the array scenarios with Immer's array-method plugin
enabled and only the candidate and Immer measured (`--library both
--immer-array-methods`): the array-related scenarios at 100 rows, and the nine
scaling scenarios at 1,000 and 10,000 rows, both freeze and patch modes. The
plugin hands raw objects to callbacks and returns them from removals, see
[`test/immer-array-methods.md`](../../test/immer-array-methods.md). These
scenarios only read in their callbacks, so their results are unchanged: all
268 Immer combinations pass the harness correctness checks with the plugin
enabled.

| Comparator | Faster / within 5% / slower | Geometric mean Immer/candidate |
| --- | ---: | ---: |
| Immer 11.1.18 with `enableArrayMethods`, all plugin cells | 211 / 1 / 36 | 1.68 |
| Array-method scenarios only | 163 / 0 / 17 | 2.15 |

| Scenario | Rows | Freeze | Patches | Candidate | Immer + plugin | Immer/candidate |
| --- | ---: | --- | --- | ---: | ---: | ---: |
| array-shift-nested | 10,000 | off | off | 7.442 | 426.146 | 57.26 |
| array-shift-nested | 10,000 | off | on | 1,208.605 | 1,487.794 | 1.23 |
| array-shift-nested | 10,000 | on | off | 234.197 | 1,197.946 | 5.12 |
| array-reverse-nested | 10,000 | off | off | 14.117 | 423.308 | 29.98 |
| array-reverse-nested | 10,000 | off | on | 1,213.295 | 1,485.004 | 1.22 |
| array-splice-insert-nested | 10,000 | off | off | 21.245 | 431.772 | 20.32 |
| array-reverse-primitive | 10,000 | off | off | 14.110 | 389.640 | 27.61 |
| array-shift-nested | 1,000 | off | on | 121.922 | 129.503 | 1.06 |
| array-shift-nested | 100 | off | off | 0.814 | 2.675 | 3.28 |
| array-push-primitive | 100 | off | off | 1.154 | 0.854 | 0.74 |
| array-sort-nested | 100 | off | off | 91.684 | 12.626 | 0.14 |
| read-missing | 10,000 | off | off | 1,871.847 | 90.560 | 0.05 |

Immer with the plugin is faster in 36 cells, all at 100 rows except the
`find`-based `read-missing` cells. Most are scenarios where the plugin hands raw
base elements to a callback or comparator, which Mutative never does: `find` in
`read-missing` (about 20x), `findIndex` in `remove-high` and
`remove-high-reuse`, `filter`, and sorts of objects in `sortById-reverse`,
`array-sort-shallow` and `array-sort-nested` (2–12x). Immer documents that
the plugin passes raw values to these callbacks, so they read the base without
creating drafts, and an edit made in a callback does not go through a draft.
[`test/immer-array-methods.md`](../../test/immer-array-methods.md) records that
documented behavior with read-only callbacks. The failures it reproduces come
from raw base objects that the plugin's removal methods return or that
reordering exposes, whose edits change the base state. The remaining cells are
`push` and `pop` with freeze and patches off (`add`, `array-push-*`,
`array-pop-*`), which Mutative leaves on the proxy path: 1.15–1.59 µs against
0.78–1.34 µs. With
patches or freezing enabled Mutative is faster on these as well. Every
`shift`, `unshift`, `splice` and `reverse` cell is faster than Immer with the
plugin; at 10,000 rows by 20–57x with freeze and patches off, about 5x with
freeze on, and 1.2–2.1x with patches on.

## Tradeoffs and limits

- Bundle size at `8fe0d9a`: the production CJS artifact is 25,558 bytes raw
  and 7,869 bytes Brotli. That is 81 Brotli bytes below the accepted baseline
  before this round (`415b91c`) and 6,044 raw, 1,921 gzip and 1,776 Brotli
  bytes above `main`. `size-limit` measures 6.47 kB against a 6.5 kB cap,
  which is 5 kB on `main`. The measured `363b3da` was 70 Brotli bytes smaller.
  The README compares the result with Immer plus the equivalent plugins.
- With patches enabled the gain narrows because one patch per moved index is
  emitted either way; without patches, moving operations on 10,000-row arrays
  take microseconds.
- Methods with callbacks (`forEach`, `map`, `filter`, `find`, `some`, `every`,
  `reduce`), `at`, `slice`, `fill`, `copyWithin`, and `sort` on arrays with
  objects keep the proxy path; their times are unchanged.
- Sparse arrays keep the proxy path, so the result and the replay of its
  patches agree on every index.
- Argument conversion, comparators and separators run in the native order
  relative to the length and element reads and exactly once; removed elements
  are always exposed as drafts, and strict mode rejects a removal before the
  array changes.
- Every timing cell but one is faster than Immer with the plugin off: `concat`
  with freeze on and patches off is within 5% (20.0 µs against 20.2 µs).
- One cell is slower than pinned v1: the same `concat` cell, 20.0 µs against
  17.8 µs. The process ranges overlap (candidate 18.0–21.8 µs, v1
  16.8–18.2 µs), the candidate matches the previous head (19.7 µs), and
  `concat` is not one of the optimized methods.
- Against the previous head's archive, 12 cells are more than 5% slower. Nine
  are freeze-on cells whose code path did not change, the cross-session drift
  seen in earlier rounds, and `update-largeObject1` with freeze off is
  process-order sensitive (below). The other two are 100-row primitive `sort`
  and `reverse` with freeze and patches off, by 0.7 µs and 0.04 µs. A
  same-session A/B of both sources inside the harness puts the contract 2–3%
  behind the previous head on 100-row primitive operations (0.01–0.12 µs), the
  cost of the added eligibility checks, and level with it at 10,000 rows.
- Wide-object insertion remains process-order sensitive: 53.8–56.6 µs when the
  candidate runs first and 98.7–102.7 µs after Immer. Both orders beat Immer
  (199.2–203.4 µs).
- Freeze-on inputs are already frozen. Allocation is sampled, and small retained
  deltas are noisy. Cold-data freezing, patch application/serialization, Map/Set,
  deeper paths, and browser engines are outside this matrix.

## Source and artifact identity

The measured source is that of [`363b3da`](https://github.com/unadlib/mutative/commit/363b3da1df5d8e729f471a909c607dd46ed1a10e);
the summary commit that follows changes documentation only. The local gate's
base checkout is [`1004d65`](https://github.com/unadlib/mutative/commit/1004d65325adb68cf09c88311e368fbdde9a7283).

SHA-256 identities (`source` uses the sorted path/content algorithm in
[`build.mjs`](../build.mjs); `production` is `dist/mutative.cjs.production.min.js`):

```text
Candidate source:     f3b52081dac0de59d02d1716ea24a6c481dfebc796b2608e08c558e707758c8b
Candidate production: 11150e6b85a2580b78994c1b3f8e33904db2710645a2541134dcc7548fa3260d
Gate base production: ed3c321d17f8c629116bc955613c635f54c113267116bd63be1e0aec2714b270
Pinned v1 production: 15ad9df11178c64f80e66797ffe784a4eeedfb03759ca59ef61a64f4142fde41
Immer production:     30fec64eb16c235f5fe771ed7e4be08eb0f67cb46c44917424a6e643f3d677b9
```

## Reproduce

Use Node 24.16.0 and the frozen lockfile at `363b3da` for the measured candidate.
Build a separate checkout of `1004d65` with its frozen lockfile for the gate base.
Run the following sequentially from the candidate checkout; timings will vary.
The [benchmark guide](../README.md) explains workload semantics and options.

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm benchmark:immer:build
node perf-testing/ci.mjs --base-dir /absolute/path/to/built-base-checkout
node perf-testing/run-benchmarks.mjs --runs 3 --patches both --output perf-testing/results/expanded-default.json
node perf-testing/run-benchmarks.mjs --runs 6 --freeze off --filter '^update-largeObject1$' --output perf-testing/results/object-order.json
node perf-testing/run-memory.mjs --runs 3 --patches both --memory-iterations 32 --filter '^(small-object-update|noop-empty|read-index|mutation-density-100pct|array-reverse-primitive|array-reverse-nested)$' --output perf-testing/results/expanded-memory-default.json

for rows in 1000 10000; do
  iterations=16
  if [ "$rows" = 10000 ]; then iterations=8; fi
  node perf-testing/run-benchmarks.mjs --runs 3 --patches both --array-size "$rows" --filter '^(read-index|read-forEach|read-missing|mutation-density-100pct|array-shift-nested|array-unshift-nested|array-splice-insert-nested|array-reverse-nested|array-reverse-primitive)$' --output "perf-testing/results/expanded-array-$rows.json"
  node perf-testing/run-memory.mjs --runs 3 --patches both --array-size "$rows" --memory-iterations "$iterations" --filter '^(read-index|mutation-density-100pct|array-reverse-primitive|array-reverse-nested)$' --output "perf-testing/results/expanded-memory-array-$rows.json"
  node perf-testing/run-benchmarks.mjs --runs 3 --patches both --library both --immer-array-methods --array-size "$rows" --filter '^(read-index|read-forEach|read-missing|mutation-density-100pct|array-shift-nested|array-unshift-nested|array-splice-insert-nested|array-reverse-nested|array-reverse-primitive)$' --output "perf-testing/results/plugin-array-$rows.json"
done
node perf-testing/run-benchmarks.mjs --runs 3 --patches both --library both --immer-array-methods --filter '^(array-|sortById-reverse|reverse-array|add$|remove$|remove-high$|update-multiple|concat|filter|mapNested|remove-reuse|remove-high-reuse)' --output perf-testing/results/plugin-default.json
```

## History

- 2026-10-02, source `6193657` (previous PR head, 2026-10-02 archive, not
  retained): 340 / 0 / 0 cells faster than Immer with the plugin off (geometric
  mean 3.78; 6.24 over the array cells, 1.58 elsewhere), 335 / 5 / 0 against
  pinned 1.3.0 (5.50), 140 / 199 / 1 against the #174 archive (2.25),
  allocation below 1.3.0 in 54 of 56 memory cells, gate 48 of 48. That source
  excluded arrays holding `undefined` from the native path and matched a
  draft's original in searches.
- 2026-10-02, local commits `c598b41`–`a1e3235` (never pushed): eligibility
  checks through property descriptors, which cost about 46 ns per element on
  the first moving operation and per visited search index. Their 1,000-row
  paired budget against the PR base measured `array-shift-nested` at 47.5 µs
  (base 470.7 µs) and `array-reverse-nested` at 48.1 µs (base 478.3 µs);
  10,000-row micro-benchmarks put `shift`, `unshift`, `splice` and `reverse`
  at 460–490 µs, slower than Immer with its array-method plugin (386–414 µs).
  The contract above replaced this approach; the correctness fixes of those
  commits remain.
- 2026-10-03, local commits `689c181`–`1ba1615` (superseded before the
  push): the first archive of the contract measured 10,000-row moves at
  57–77 µs instead of 7–22 µs, and 100-row array operations about 0.9 µs
  slower than the previous PR head. An A/B of candidate builds inside the
  harness attributed this to two costs. The per-element `in` scan took 4–5 ns
  per element once many array shapes had passed through it, against 0.5 ns in
  an isolated loop. A WeakSet entry added for every array draft whose method
  was read cost about 0.17 µs per producer call. `473c149` runs the `in` scan
  only for arrays in which `includes` finds `undefined`, and `6ce062b`
  registers an array only when a live producer switches between arrays. An
  intermediate commit that moved the density check into the method wrapper
  (`8c42ce2`) rested on a garbage-collection-dominated loop and is reverted by
  `1cb86c0`.
