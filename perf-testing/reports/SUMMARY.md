# Draft fast paths: performance summary

Measurements from 2026-10-01 UTC for [PR #174](https://github.com/unadlib/mutative/pull/174).
The candidate and pinned npm baseline both report Mutative 1.3.0; the candidate
contains unreleased source changes. Immer is pinned to 11.1.18 and Mitata to
1.0.34. Array-method plugins are disabled. Complete measurements, earlier
baselines, and per-process statistics are in the [verified archive](./README.md).

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

| Comparator                                | Faster / within 5% / slower, out of 340 cells |
| ----------------------------------------- | --------------------------------------------: |
| Pinned Immer 11.1.18                      |                                   338 / 2 / 0 |
| Pinned npm Mutative 1.3.0                 |                                   334 / 5 / 1 |
| Archived 2026-09-30 unoptimized candidate |                                   337 / 3 / 0 |

Selected times below are microseconds per complete scenario, with freeze off.
The archived unoptimized candidate is a separate measurement from the pinned
npm baseline. Scenario counts are not an application-weighted performance score.

| Scenario             |   Rows | Patches | Candidate |   Pinned v1 |     Immer | Sept 30 candidate |
| -------------------- | -----: | ------- | --------: | ----------: | --------: | ----------------: |
| small-object-update  |      — | off     |     0.638 |       1.135 |     0.874 |             1.157 |
| read-index           |    100 | off     |    49.096 |      77.206 |    95.463 |            78.133 |
| rtkq-sequence        |    100 | off     | 1,033.135 |   1,768.433 | 1,176.822 |         2,053.573 |
| array-reverse-nested |  1,000 | on      |   662.943 |  26,254.482 |   853.155 |        27,930.895 |
| array-reverse-nested | 10,000 | on      | 7,736.579 | 284,332.413 | 9,940.651 |       281,061.934 |

Sampled allocation is lower than pinned v1 in 44 of 56 memory cells. For nested
reverse at 10,000 rows with freeze off and patches on, allocation is about
11,429 KiB/iteration versus 268,459 KiB for pinned v1; retained output is about
1,797 versus 9,891 KiB. The archived local base/head budget run passed all 48
decisions: candidate/base paired median ratios span 0.023–0.810 for latency,
0.044–0.764 for allocation, and 0.185–1.252 for retained output. These are
historical measurements; current PR checks independently measure their base/head.

## Tradeoffs and limits

- The one slower timing cell against pinned v1 is `concat` with freeze and
  patches on: 18.121 versus 17.139 µs, with overlapping process ranges.
- Primitive-array reverse allocates 13–36% more than pinned v1 across the
  measured sizes/modes while running faster. Retained output is approximately
  equal or lower. Nested reverse without patches at 1,000 rows retains about
  7.90 KiB/output versus 6.29–6.86 KiB for v1.
- The child-draft registry preserves accessor behavior with additional read-path
  work. The archived review notes report about 3% higher aggregate time and
  6–11% more transient read allocation than the earlier branch variant with the
  accessor regression; all candidate results above include the final fixes.
- Wide-object insertion is process-order sensitive: 53.5–56.5 µs when the
  candidate runs first and 97.5–102.1 µs after Immer. Both orders beat Immer,
  but a pooled median conceals the difference.
- Freeze-on inputs are already frozen. Allocation is sampled, and small retained
  deltas are noisy. Cold-data freezing, patch application/serialization, Map/Set,
  sparse arrays, deeper paths, and browser engines are outside this matrix.

## Source and artifact identity

The archive snapshot is [`ed16bd4`](https://github.com/unadlib/mutative/commit/ed16bd466b301bc3babcaa2c87608fb53441e3ec).
Its source matches the measured candidate. The raw metadata retains the earlier
pre-amend revision `027e23edd2145c8fb80d8f20e1a10e9bb30d7999`; use the source
and production hashes below to identify those bytes. The local gate's actual
base checkout is [`d3b86b5`](https://github.com/unadlib/mutative/commit/d3b86b5a237e6e04d051b311b0904068c204d0d3).
The Sept 30 expanded report records `ea629e1b8967bbe8200ce4f2dd9205eba664be8b`,
whose source and production hashes match that gate base.

SHA-256 identities (`source` uses the sorted path/content algorithm in
[`build.mjs`](../build.mjs); `production` is `dist/mutative.cjs.production.min.js`):

```text
Candidate source:     747ac46416375c6cf89c1c61eb2ca281be93e34f5606c53d45f8a58329437dbb
Candidate production: ed3c321d17f8c629116bc955613c635f54c113267116bd63be1e0aec2714b270
Gate base source:     db8bdf42f2d79b78a613ef9169fb96fd8d30ded0e768308dda04798cdb0977ad
Gate base production: f339f5021704f2368ff982fdb444fb6a31faac9537d1990a47790f4106dbf02b
Pinned v1 production: 15ad9df11178c64f80e66797ffe784a4eeedfb03759ca59ef61a64f4142fde41
Immer production:     30fec64eb16c235f5fe771ed7e4be08eb0f67cb46c44917424a6e643f3d677b9
```

## Reproduce

Use Node 24.16.0 and the frozen lockfile at `ed16bd4` for the measured candidate.
Build a separate checkout of `d3b86b5` with its frozen lockfile for the gate base.
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
