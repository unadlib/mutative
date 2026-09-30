# Patch generation measurements: 2026-09-30

Mutative 1.3.0 vs Immer 11.1.18; clean benchmark build at `3e206b05b7e131482a3febc766bab03b683a4049`. Apple M1 Max, 64 GiB RAM, Node v24.16.0, V8 13.6.233.17-node.49.

These three datasets contain **792 measured trials in nine independent processes**: 504 default trials and 144 at each larger array size. Each dataset has three sequential processes, with library, freeze, and patch order reversed in the second process. All comparisons below use the median of independent-process mean times.

**All timing tables below have patches enabled.** Both forward and inverse patches are generated at every reducer call. Times are microseconds per complete scenario; I/M = Immer time / Mutative time, so ratios above 1 favor Mutative. Reuse scenarios contain 10 calls, mixed contains five, and RTKQ contains 200. Small differences near 1 do not establish a decisive winner.

The same batches also measured patches off, providing contemporaneous controls. Both libraries use array paths and index-based array removals; Mutative uses `enablePatches: { arrayLengthAssignment: false }`, rather than its default length-assignment shortcut. The Immer array-method plugin is disabled. The timed path excludes patch replay, serialization, aggregation across calls, configuration, fixture construction, and validation. Each returned producer tuple escapes.

Freeze off uses unfrozen state and payloads. Freeze on uses deeply pre-frozen state and payloads, with real output freezing enabled. These are ongoing updates, not cold full-graph freezes or fresh incoming unfrozen data. Each array row contains nested objects and ten nested item objects; these are not primitive-element arrays.

## Default workloads (100 array rows)

| Scenario                  | Freeze off: Mutative µs | Immer µs |   I/M | Freeze on: Mutative µs | Immer µs |   I/M |
| ------------------------- | ----------------------: | -------: | ----: | ---------------------: | -------: | ----: |
| add                       |                   3.888 |    5.073 | 1.305 |                 22.237 |   27.927 | 1.256 |
| remove                    |                3046.490 |   86.085 | 0.028 |               3090.203 |  112.294 | 0.036 |
| filter                    |                  47.092 |   33.089 | 0.703 |                 65.440 |   55.264 | 0.844 |
| update                    |                   3.751 |    3.503 | 0.934 |                 23.101 |   27.393 | 1.186 |
| concat                    |                   1.262 |    1.209 | 0.958 |                 19.156 |   23.051 | 1.203 |
| mapNested                 |                 100.069 |   73.752 | 0.737 |                120.840 |   97.774 | 0.809 |
| update-largeObject1       |                 236.043 |  159.080 | 0.674 |                358.217 |  273.633 | 0.764 |
| update-largeObject2       |                 522.349 |  576.612 | 1.104 |                818.540 |  877.377 | 1.072 |
| update-high               |                  34.761 |   26.432 | 0.760 |                 48.265 |   45.402 | 0.941 |
| update-multiple           |                  17.028 |   18.402 | 1.081 |                 31.635 |   38.235 | 1.209 |
| remove-high               |                 619.744 |   51.950 | 0.084 |                652.892 |   70.601 | 0.108 |
| sortById-reverse          |                3119.311 |   87.524 | 0.028 |               3217.365 |  105.430 | 0.033 |
| reverse-array             |                3149.267 |   85.056 | 0.027 |               3167.932 |  105.071 | 0.033 |
| update-reuse              |                  55.646 |   49.914 | 0.897 |                191.856 |  233.438 | 1.217 |
| update-high-reuse         |                 358.881 |  277.610 | 0.774 |                506.940 |  468.977 | 0.925 |
| remove-reuse              |               27784.899 |  789.729 | 0.028 |              28054.950 |  983.854 | 0.035 |
| remove-high-reuse         |                4785.654 |  486.668 | 0.102 |               5008.593 |  655.411 | 0.131 |
| update-largeObject1-reuse |                2234.841 | 1426.898 | 0.638 |               3312.887 | 2757.856 | 0.832 |
| update-largeObject2-reuse |                5436.931 | 6219.848 | 1.144 |               8473.516 | 9232.102 | 1.090 |
| mixed-sequence            |                 145.052 |   95.887 | 0.661 |                213.952 |  187.853 | 0.878 |
| rtkq-sequence             |                2136.247 | 1551.253 | 0.726 |               5566.332 | 5143.060 | 0.924 |

Complete matrix, reducer-call counts, operation counts, per-process ranges, and sample p99: [Markdown](./2026-09-30-m1-max-node24-patches-default.md), [JSON](./2026-09-30-m1-max-node24-patches-default.json).

## Array 1,000

| Scenario        | Freeze off: Mutative µs | Immer µs |   I/M | Freeze on: Mutative µs | Immer µs |   I/M |
| --------------- | ----------------------: | -------: | ----: | ---------------------: | -------: | ----: |
| add             |                  19.631 |   30.042 | 1.530 |                 59.643 |  118.039 | 1.979 |
| remove          |               33003.604 |  880.735 | 0.027 |              33099.950 |  962.779 | 0.029 |
| mapNested       |                 970.228 |  637.130 | 0.657 |               1013.831 |  727.550 | 0.718 |
| update-high     |                 312.698 |  221.835 | 0.709 |                353.415 |  312.598 | 0.885 |
| update-multiple |                  17.128 |   18.190 | 1.062 |                 60.421 |  109.448 | 1.811 |
| reverse-array   |               32704.867 |  875.262 | 0.027 |              33931.006 |  967.966 | 0.029 |

Complete matrix, reducer-call counts, operation counts, per-process ranges, and sample p99: [Markdown](./2026-09-30-m1-max-node24-patches-array-1000.md), [JSON](./2026-09-30-m1-max-node24-patches-array-1000.json).

## Array 10,000

| Scenario        | Freeze off: Mutative µs |  Immer µs |   I/M | Freeze on: Mutative µs |  Immer µs |   I/M |
| --------------- | ----------------------: | --------: | ----: | ---------------------: | --------: | ----: |
| add             |                 166.352 |   266.852 | 1.604 |                422.007 |   987.143 | 2.339 |
| remove          |              338697.285 | 10342.811 | 0.031 |             341802.372 | 10963.676 | 0.032 |
| mapNested       |               11361.867 |  7253.655 | 0.638 |              11914.879 |  8393.229 | 0.704 |
| update-high     |                3316.142 |  2257.699 | 0.681 |               3664.737 |  3077.313 | 0.840 |
| update-multiple |                  19.641 |    20.029 | 1.020 |                280.152 |   755.435 | 2.697 |
| reverse-array   |              341745.896 | 10535.553 | 0.031 |             342821.261 | 11198.557 | 0.033 |

Complete matrix, reducer-call counts, operation counts, per-process ranges, and sample p99: [Markdown](./2026-09-30-m1-max-node24-patches-array-10000.md), [JSON](./2026-09-30-m1-max-node24-patches-array-10000.json).

## Additional cost relative to patches off

Each factor is the patches-on median divided by the patches-off median from the **same dataset and freeze mode**. Values near or below 1 can reflect measurement variation; they do not prove that patches remove work. No historical timing is used as the control.

| Array rows | Scenario        | Mutative off-freeze factor | Immer off-freeze factor | Mutative on-freeze factor | Immer on-freeze factor |
| ---------: | --------------- | -------------------------: | ----------------------: | ------------------------: | ---------------------: |
|        100 | add             |                       1.75 |                    2.63 |                      1.15 |                   1.10 |
|        100 | remove          |                      34.78 |                    1.19 |                     27.91 |                   1.15 |
|        100 | update-multiple |                       1.43 |                    1.82 |                      1.20 |                   1.30 |
|        100 | reverse-array   |                      35.29 |                    1.18 |                     30.60 |                   1.17 |
|       1000 | add             |                       5.90 |                   10.38 |                      1.41 |                   1.30 |
|       1000 | remove          |                      38.40 |                    1.26 |                     36.89 |                   1.24 |
|       1000 | update-multiple |                       1.42 |                    1.81 |                      1.12 |                   1.12 |
|       1000 | reverse-array   |                      37.27 |                    1.26 |                     36.33 |                   1.23 |
|      10000 | add             |                      15.36 |                   25.08 |                      1.57 |                   1.33 |
|      10000 | remove          |                      31.15 |                    1.24 |                     30.88 |                   1.19 |
|      10000 | update-multiple |                       1.35 |                    1.69 |                      1.02 |                   1.02 |
|      10000 | reverse-array   |                      30.47 |                    1.23 |                     29.03 |                   1.20 |

## Interpretation and hotspot evidence

- At the default size, freezing off gives Mutative a lower numeric median in 4/21 cases and Immer in 17/21. This is a case count, not an application-weighted score.
- At the default size, freezing on gives Mutative a lower numeric median in 7/21 cases and Immer in 14/21. This is a case count, not an application-weighted score.
- At 10,000 rows, freezing-on push favors Mutative by 2.34x and five-item updates by 2.70x. With freezing off, five-item updates are close (I/M 1.02), while push favors Mutative by 1.60x.
- Complex-array deletion and reordering have a much larger patch cost in Mutative. At 10,000 rows with freezing off, deleting the head takes 338.697 vs 10.343 ms (Mutative/Immer 32.75); reversal takes 341.746 vs 10.536 ms (Mutative/Immer 32.44).
- Both libraries generate identical forward/inverse **operation counts** in every measured scenario and freeze mode. At 10,000 rows, deletion and reversal each generate 10,000 forward and 10,000 inverse operations. Thus operation-count differences do not explain the large gap.
- CPU profiling after all latency measurements focused on 1,000-row reversal, freezing off, patches on. Mutative: 2,160 samples, 3,255.25 ms sampled time; `deepClone` at `src/utils/copy.ts:96` accounts for 67.49% exclusive time and about 84.68% inclusive time. `generateArrayPatches` calls `cloneIfNeeded` for draft-valued replacements, and `cloneIfNeeded` recursively deep-clones drafts. This identifies patch-value deep cloning as a major hotspot in this case; it does not establish the same percentage in every scenario. Inclusive times are not additive.
- The Immer control profile has 554 samples and 844.42 ms sampled time; it used 1,000 iterations while Mutative used 100. Profiles include instrumentation overhead and different iteration counts, so their total durations are not latency comparisons. Use the benchmark tables for latency.
- The 1,000-property object baseline remains order-sensitive: Mutative patches-off means range from 57.793 to 238.551 µs. Do not interpret its pooled on/off factor as isolated patch overhead. Near-equal results and desktop background activity also limit broad rankings.

[Captured profile metadata, hashes, and complete analyzer output](./2026-09-30-m1-max-node24-patches-profiles.json). Raw profiles, metadata, and map snapshots remain in the ignored local `perf-testing/results/` directory. Reproduce the hotspot profiles with the already-built bundle:

```sh
node --expose-gc --enable-source-maps perf-testing/dist/immutability-profiling.mjs --library mutative --freeze off --patches on --filter '^reverse-array$' --array-size 1000 --iterations 100 --output perf-testing/results/patches-reverse-1000-mutative-off.cpuprofile
node --expose-gc --enable-source-maps perf-testing/dist/immutability-profiling.mjs --library immer --freeze off --patches on --filter '^reverse-array$' --array-size 1000 --iterations 1000 --output perf-testing/results/patches-reverse-1000-immer-off.cpuprofile
node perf-testing/read-cpuprofile.mjs perf-testing/results/patches-reverse-1000-mutative-off.cpuprofile
node perf-testing/read-cpuprofile.mjs perf-testing/results/patches-reverse-1000-immer-off.cpuprofile
```

Useful next dimensions are primitive vs nested patch values, allocation/GC and patch byte size, and separate forward/inverse application and serialization costs. The current results measure state production and patch generation only.
