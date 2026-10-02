# Native array methods: performance summary

Measurements from 2026-10-02 UTC for [PR #75](https://github.com/unadlib/mutative/pull/75).
The candidate and pinned npm baseline both report Mutative 1.3.0; the candidate
contains unreleased source changes, including the draft fast paths from
[PR #174](https://github.com/unadlib/mutative/pull/174). Immer is pinned to
11.1.18 and Mitata to 1.0.34. Array-method plugins are disabled on both sides:
the harness never calls Immer's `enableArrayMethods`, and Mutative's native array
methods need no option. Complete measurements and per-process statistics belong
to the archive batch described in the [archive index](./README.md).

## Scope and results

Apple M1 Max, 64 GiB RAM, darwin/arm64 (kernel 25.6.0), Node 24.16.0,
V8 13.6.233.17-node.49. Jobs ran sequentially with normal desktop activity.
The suite covers 67 scenarios at 100 rows and nine scaling scenarios at 1,000
and 10,000 rows, each with both freeze and patch modes: 3,060 timing trials in
nine processes and 504 isolated memory workers. A separate six-process control
checks wide-object insertion order effects.

Each timing cell is one scenario, size, and mode. The comparison uses medians of
three independent-process means; a candidate time below 95% of the comparator
is faster, above 105% is slower, and otherwise is within the 5% band.

| Comparator                              | Faster / within 5% / slower, out of 340 cells |
| --------------------------------------- | --------------------------------------------: |
| Pinned Immer 11.1.18                    |                                   340 / 0 / 0 |
| Pinned npm Mutative 1.3.0               |                                   335 / 5 / 0 |
| Archived 2026-10-01 candidate (PR #174) |                                 140 / 199 / 1 |

The change is concentrated in the 216 array-related cells (array method
scenarios, `add`, `remove`, `filter`, `concat`, `mapNested`, `update-multiple`,
`sortById-reverse`, `reverse-array`, and the `remove*-reuse` sequences), where
the geometric mean of Immer time over candidate time is 6.24 (pinned v1
11.22, the 2026-10-01 candidate 3.59). The other 124 cells measure
within noise of the 2026-10-01 candidate (geometric mean 0.99).

Selected times below are microseconds per complete scenario, with freeze off.
Scenario counts are not an application-weighted performance score.

| Scenario                   |   Rows | Patches | Candidate |   Pinned v1 |      Immer | Oct 1 candidate |
| -------------------------- | -----: | ------- | --------: | ----------: | ---------: | --------------: |
| small-object-update        |      — | off     |     0.640 |       1.124 |      0.860 |           0.638 |
| read-index                 |    100 | off     |    49.680 |      77.370 |     95.347 |          49.096 |
| rtkq-sequence              |    100 | off     | 1,048.312 |   1,774.578 |  1,177.539 |       1,033.135 |
| sortById-reverse           |    100 | off     |    54.639 |     100.202 |     73.221 |          54.192 |
| array-shift-nested         |    100 | off     |     0.802 |      86.917 |     71.528 |          46.984 |
| array-splice-insert-nested |  1,000 | off     |     5.196 |     424.406 |    367.433 |         238.127 |
| array-shift-nested         | 10,000 | off     |     7.494 |   8,974.679 |  8,234.455 |       5,101.396 |
| array-reverse-nested       | 10,000 | off     |    14.243 |   9,643.823 |  8,613.470 |       5,668.571 |
| array-reverse-nested       | 10,000 | on      | 1,220.189 | 288,186.142 | 10,246.257 |       7,736.579 |
| array-reverse-primitive    | 10,000 | off     |    14.195 |   4,273.788 |  4,336.019 |       2,888.809 |
| read-index                 | 10,000 | off     | 5,273.611 |   8,009.158 | 10,078.648 |       5,192.678 |

Sampled allocation is lower than pinned v1 in 54 of 56 memory cells.
The two exceptions are `noop-empty` cells (freeze off without patches, freeze on with patches), where both libraries allocate about 3.5–4 KiB per iteration. For nested reverse at 10,000 rows with freeze off, allocation is about 87 KiB/iteration without patches (11,074 KiB for pinned v1, 12,892 KiB for Immer) and about 3,020 KiB with patches (268,485 KiB for v1, 14,823 KiB for Immer); retained output with patches is about 1,797 versus 9,891 KiB for v1. The local base/head budget run against `main` passed all 48
decisions: candidate/base paired median ratios span 0.003–1.009 for latency,
0.017–1.009 for allocation, and 1.000–1.000 for retained output. These are
historical measurements; current PR checks independently measure their base/head.

## Tradeoffs and limits

- Bundle size: the production bundle grows by 5.4 KB raw, 1.8 KB gzip and
  1.6 KB brotli; `size-limit` moved from 5 KB to 6.5 KB (6.38 kB measured). The
  README compares the result with Immer plus the equivalent plugins.
- With patches enabled the gain narrows to about 8x because one patch
  per moved index is emitted either way; without patches, moving operations on
  10,000-row arrays take microseconds.
- Methods with callbacks (`forEach`, `map`, `filter`, `find`, `some`, `every`,
  `reduce`), `at`, `slice`, `fill`, `copyWithin`, and `sort` on arrays with
  objects keep the proxy path; their times are unchanged. `sort` and `join`
  run natively only on arrays of primitives, which also keeps strict mode's
  access checks intact.
- Sparse arrays and arrays holding `undefined` keep the proxy path, so the
  result and the replay of its patches agree on every index; operations that
  change nothing (sorting a sorted array, replacing equal values, reversing a
  palindrome) leave the state untouched, as through the proxy.
- `indexOf`, `lastIndexOf` and `includes` also match a draft's original object,
  where the proxy path returned -1.
- Argument conversion, comparators and separators run in the native order
  relative to the length and element reads and exactly once, so user code
  that changes the array during a call observes the same result as through
  the proxy; removed elements are always exposed as drafts, and strict mode
  rejects a removal before the array changes.
- Every timing cell is faster than Immer.
- No cell is slower than pinned v1; the five within 5% are `add` and `concat` with freeze on (both patch modes for `concat`), `update-largeObject1` and `update-largeObject1-reuse` with freeze off. One default cell is more than 5% slower than the 2026-10-01 archive, `concat` with freeze and patches on (18.1 → 19.3 µs), with overlapping process ranges.
- Wide-object insertion remains process-order sensitive: 55.4–57.9 µs when the
  candidate runs first and 98.9–100.5 µs after Immer. Both orders beat Immer.
- Freeze-on inputs are already frozen. Allocation is sampled, and small retained
  deltas are noisy. Cold-data freezing, patch application/serialization, Map/Set,
  sparse arrays, deeper paths, and browser engines are outside this matrix.

## Source and artifact identity

The measured source is that of [`6193657`](https://github.com/unadlib/mutative/commit/6193657a2fbb87b247c8c92a9ef30a79d5f70f61).
The gate's raw metadata records `ffec47b`, the same source before a commit
message was reworded; the summary commit that follows changes documentation
only. The local gate's
base checkout is [`1004d65`](https://github.com/unadlib/mutative/commit/1004d65325adb68cf09c88311e368fbdde9a7283).

SHA-256 identities (`source` uses the sorted path/content algorithm in
[`build.mjs`](../build.mjs); `production` is `dist/mutative.cjs.production.min.js`):

```text
Candidate source:     7305cab6a2818ac8fe3da8678b147e9d53ae27098a1e8d79b66d02e04819218c
Candidate production: ff68ab4316605d72405e73b85c18fff2e84119d16772c6d1755f709148e282e5
Gate base source:     747ac46416375c6cf89c1c61eb2ca281be93e34f5606c53d45f8a58329437dbb
Gate base production: ed3c321d17f8c629116bc955613c635f54c113267116bd63be1e0aec2714b270
Pinned v1 production: 15ad9df11178c64f80e66797ffe784a4eeedfb03759ca59ef61a64f4142fde41
Immer production:     30fec64eb16c235f5fe771ed7e4be08eb0f67cb46c44917424a6e643f3d677b9
```

## Reproduce

Use Node 24.16.0 and the frozen lockfile at `6193657` for the measured candidate.
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
done
```
