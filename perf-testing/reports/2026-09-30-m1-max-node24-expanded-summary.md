# Expanded versioned performance baseline: 2026-09-30 UTC

Candidate: current production Mutative 1.3.0 at `ea629e1`; baseline: npm Mutative 1.3.0; Immer: pinned 11.1.18. The candidate has not been relabeled v2. A built v2 Git checkout can be selected with `MUTATIVE_PERF_CANDIDATE_DIR`. Array-method plugins are disabled throughout.

Apple M1 Max, 64 GiB, macOS 26.6.2, Node 24.16.0 / V8 13.6.233.17-node.49. Timing and memory jobs ran sequentially, with no concurrent local tests or profiling. Normal desktop activity remained present. Freeze on uses pre-frozen state and payloads, not cold incoming data.

## Datasets

|            Dataset |                      Scope | Workers | Measured trials |                                                                                                                             Tables / JSON |
| -----------------: | -------------------------: | ------: | --------------: | ----------------------------------------------------------------------------------------------------------------------------------------: |
|            default |           all 67 scenarios |       3 |            2412 |                       [Tables](./2026-09-30-m1-max-node24-expanded-default.md) / [JSON](./2026-09-30-m1-max-node24-expanded-default.json) |
|         array-1000 |        9 scaling scenarios |       3 |             324 |                 [Tables](./2026-09-30-m1-max-node24-expanded-array-1000.md) / [JSON](./2026-09-30-m1-max-node24-expanded-array-1000.json) |
|        array-10000 |        9 scaling scenarios |       3 |             324 |               [Tables](./2026-09-30-m1-max-node24-expanded-array-10000.md) / [JSON](./2026-09-30-m1-max-node24-expanded-array-10000.json) |
|     memory-default | 6 representative scenarios |     216 |             216 |         [Tables](./2026-09-30-m1-max-node24-expanded-memory-default.md) / [JSON](./2026-09-30-m1-max-node24-expanded-memory-default.json) |
|  memory-array-1000 | 4 representative scenarios |     144 |             144 |   [Tables](./2026-09-30-m1-max-node24-expanded-memory-array-1000.md) / [JSON](./2026-09-30-m1-max-node24-expanded-memory-array-1000.json) |
| memory-array-10000 | 4 representative scenarios |     144 |             144 | [Tables](./2026-09-30-m1-max-node24-expanded-memory-array-10000.md) / [JSON](./2026-09-30-m1-max-node24-expanded-memory-array-10000.json) |

The comparison datasets contain **3,060 timing trials in nine independent processes** and **504 isolated memory workers**. Each selected scenario/library/freeze/patch combination passes correctness validation before measurement. Timing tables use medians of independent-process means. Memory tables use medians across three independent workers per combination. Every dataset uses the same clean benchmark build and production artifact hashes.

## Selected timing comparisons

Times are microseconds per full scenario. I/C = Immer time divided by candidate time; above 1 favors the candidate. These rows compare identical fixtures and modes. Small differences near parity do not establish a decisive winner. Full tables retain all cases, with process ranges and sample statistics in JSON.

|     Dataset |                Scenario | Freeze | Patches | Candidate µs | Pinned v1 µs |  Immer µs |   I/C |
| ----------: | ----------------------: | -----: | ------: | -----------: | -----------: | --------: | ----: |
|     default |     small-object-update |    off |     off |        1.157 |        1.137 |     0.888 | 0.768 |
|     default |    small-array-1-update |    off |     off |        1.752 |        1.727 |     1.266 | 0.723 |
|     default |   small-array-10-update |    off |     off |        1.743 |        1.736 |     1.276 | 0.732 |
|     default |              noop-empty |    off |     off |        0.322 |        0.323 |     0.284 | 0.884 |
|     default |              read-index |    off |     off |       78.133 |       78.278 |    95.268 | 1.219 |
|  array-1000 |              read-index |    off |     off |      782.096 |      780.538 |   932.591 | 1.192 |
|  array-1000 |              read-index |    off |      on |      783.435 |      784.794 |   935.215 | 1.194 |
|  array-1000 |              read-index |     on |     off |      786.008 |      786.087 |   956.486 | 1.217 |
|  array-1000 |              read-index |     on |      on |      788.849 |      788.347 |   961.740 | 1.219 |
|  array-1000 | mutation-density-100pct |    off |     off |     1243.233 |     1270.856 |  1021.878 | 0.822 |
|  array-1000 | mutation-density-100pct |    off |      on |     2005.610 |     2031.011 |  1980.555 | 0.988 |
|  array-1000 | mutation-density-100pct |     on |     off |     1416.805 |     1419.058 |  1388.964 | 0.980 |
|  array-1000 | mutation-density-100pct |     on |      on |     2160.031 |     2218.371 |  2294.120 | 1.062 |
|  array-1000 | array-reverse-primitive |    off |     off |      415.997 |      415.528 |   414.891 | 0.997 |
|  array-1000 | array-reverse-primitive |    off |      on |      552.388 |      550.874 |   595.743 | 1.078 |
|  array-1000 | array-reverse-primitive |     on |     off |      428.972 |      430.001 |   474.430 | 1.106 |
|  array-1000 | array-reverse-primitive |     on |      on |      563.937 |      564.723 |   653.727 | 1.159 |
|  array-1000 |    array-reverse-nested |    off |     off |      875.727 |      880.230 |   714.217 | 0.816 |
|  array-1000 |    array-reverse-nested |    off |      on |    27930.895 |    27621.813 |   855.975 | 0.031 |
|  array-1000 |    array-reverse-nested |     on |     off |      901.764 |      897.635 |   784.788 | 0.870 |
|  array-1000 |    array-reverse-nested |     on |      on |    28614.099 |    28761.754 |   928.956 | 0.032 |
| array-10000 |              read-index |    off |     off |     8209.532 |     8205.942 | 12583.785 | 1.533 |
| array-10000 |              read-index |    off |      on |     8097.345 |     8048.414 | 12535.330 | 1.548 |
| array-10000 |              read-index |     on |     off |     8088.567 |     8193.166 | 13036.809 | 1.612 |
| array-10000 |              read-index |     on |      on |     8141.533 |     8219.217 | 12746.216 | 1.566 |
| array-10000 | mutation-density-100pct |    off |     off |    13912.185 |    13864.554 | 13878.745 | 0.998 |
| array-10000 | mutation-density-100pct |    off |      on |    21638.468 |    21835.365 | 24376.917 | 1.127 |
| array-10000 | mutation-density-100pct |     on |     off |    16375.764 |    16396.253 | 17589.998 | 1.074 |
| array-10000 | mutation-density-100pct |     on |      on |    24160.382 |    23654.865 | 27876.574 | 1.154 |
| array-10000 | array-reverse-primitive |    off |     off |     4335.936 |     4334.454 |  4500.755 | 1.038 |
| array-10000 | array-reverse-primitive |    off |      on |     5960.237 |     5688.633 |  6282.241 | 1.054 |
| array-10000 | array-reverse-primitive |     on |     off |     4449.527 |     4431.391 |  5085.712 | 1.143 |
| array-10000 | array-reverse-primitive |     on |      on |     6237.291 |     5904.493 |  6999.987 | 1.122 |
| array-10000 |    array-reverse-nested |    off |     off |    10033.327 |    11129.314 | 10004.823 | 0.997 |
| array-10000 |    array-reverse-nested |    off |      on |   281061.934 |   281393.028 | 11970.005 | 0.043 |
| array-10000 |    array-reverse-nested |     on |     off |    10358.848 |    11488.816 | 10856.477 | 1.048 |
| array-10000 |    array-reverse-nested |     on |      on |   288795.323 |   284175.601 | 13030.821 | 0.045 |

## Selected memory comparisons

Allocated bytes are V8 sampling estimates including harness overhead and collected temporary objects. Retained-output heap compares post-GC live-output and released-output snapshots, cancelling persistent runtime-cache growth. Small or negative retained deltas can be noise. RSS snapshots and explicit GC durations are available in the full reports; they are not producer latency or peak-memory measurements. Iterations/pass are 32 at the default size, 16 at 1,000 rows, and 8 at 10,000 rows. Retention keeps one output per scenario iteration, or the last producer tuple with patches enabled.

Read/no-op results share the already-live fixture, so their small retained-heap deltas should not be interpreted as newly allocated output graphs. Patch tuples can retain additional arrays even when they contain zero operations.

|            Dataset |                Scenario |     Library | Freeze | Patches | Allocated KiB/iteration (estimate) | Retained-output heap KiB/iteration |
| -----------------: | ----------------------: | ----------: | -----: | ------: | ---------------------------------: | ---------------------------------: |
|     memory-default |              read-index |    mutative |    off |     off |                            150.632 |                              0.606 |
|     memory-default |              read-index | mutative-v1 |    off |     off |                            151.754 |                              0.606 |
|     memory-default |              read-index |       immer |    off |     off |                            194.725 |                             -0.002 |
|     memory-default |              read-index |    mutative |    off |      on |                            150.725 |                              0.739 |
|     memory-default |              read-index | mutative-v1 |    off |      on |                            151.800 |                              0.739 |
|     memory-default |              read-index |       immer |    off |      on |                            195.269 |                              0.134 |
|     memory-default |              read-index |    mutative |     on |     off |                            153.950 |                              0.606 |
|     memory-default |              read-index | mutative-v1 |     on |     off |                            154.062 |                              0.606 |
|     memory-default |              read-index |       immer |     on |     off |                            194.437 |                             -0.002 |
|     memory-default |              read-index |    mutative |     on |      on |                            150.665 |                              0.739 |
|     memory-default |              read-index | mutative-v1 |     on |      on |                            149.943 |                              0.739 |
|     memory-default |              read-index |       immer |     on |      on |                            194.129 |                              0.134 |
|     memory-default | array-reverse-primitive |    mutative |    off |     off |                             20.967 |                              0.920 |
|     memory-default | array-reverse-primitive | mutative-v1 |    off |     off |                             20.152 |                              0.920 |
|     memory-default | array-reverse-primitive |       immer |    off |     off |                             32.375 |                              0.865 |
|     memory-default | array-reverse-primitive |    mutative |    off |      on |                             51.056 |                             18.896 |
|     memory-default | array-reverse-primitive | mutative-v1 |    off |      on |                             50.666 |                             18.896 |
|     memory-default | array-reverse-primitive |       immer |    off |      on |                             61.850 |                             18.842 |
|     memory-default | array-reverse-primitive |    mutative |     on |     off |                             25.206 |                              0.932 |
|     memory-default | array-reverse-primitive | mutative-v1 |     on |     off |                             24.822 |                              0.935 |
|     memory-default | array-reverse-primitive |       immer |     on |     off |                             31.672 |                              0.869 |
|     memory-default | array-reverse-primitive |    mutative |     on |      on |                             55.545 |                             18.909 |
|     memory-default | array-reverse-primitive | mutative-v1 |     on |      on |                             53.989 |                             18.909 |
|     memory-default | array-reverse-primitive |       immer |     on |      on |                             60.643 |                             18.846 |
|     memory-default |    array-reverse-nested |    mutative |    off |     off |                            127.382 |                              0.979 |
|     memory-default |    array-reverse-nested | mutative-v1 |    off |     off |                            125.304 |                              0.979 |
|     memory-default |    array-reverse-nested |       immer |    off |     off |                            150.637 |                              0.810 |
|     memory-default |    array-reverse-nested |    mutative |    off |      on |                           2685.192 |                            100.351 |
|     memory-default |    array-reverse-nested | mutative-v1 |    off |      on |                           2669.835 |                            100.351 |
|     memory-default |    array-reverse-nested |       immer |    off |      on |                            178.742 |                             18.780 |
|     memory-default |    array-reverse-nested |    mutative |     on |     off |                            130.646 |                              0.989 |
|     memory-default |    array-reverse-nested | mutative-v1 |     on |     off |                            131.989 |                              0.989 |
|     memory-default |    array-reverse-nested |       immer |     on |     off |                            149.551 |                              0.869 |
|     memory-default |    array-reverse-nested |    mutative |     on |      on |                           2692.628 |                            100.353 |
|     memory-default |    array-reverse-nested | mutative-v1 |     on |      on |                           2687.149 |                            100.353 |
|     memory-default |    array-reverse-nested |       immer |     on |      on |                            180.344 |                             18.845 |
|  memory-array-1000 |              read-index |    mutative |    off |     off |                           1377.313 |                              1.707 |
|  memory-array-1000 |              read-index | mutative-v1 |    off |     off |                           1377.531 |                              1.707 |
|  memory-array-1000 |              read-index |       immer |    off |     off |                           1590.069 |                             -0.003 |
|  memory-array-1000 |              read-index |    mutative |    off |      on |                           1377.093 |                              1.840 |
|  memory-array-1000 |              read-index | mutative-v1 |    off |      on |                           1383.951 |                              1.840 |
|  memory-array-1000 |              read-index |       immer |    off |      on |                           1599.995 |                              0.135 |
|  memory-array-1000 |              read-index |    mutative |     on |     off |                           1379.874 |                              1.707 |
|  memory-array-1000 |              read-index | mutative-v1 |     on |     off |                           1374.651 |                              1.707 |
|  memory-array-1000 |              read-index |       immer |     on |     off |                           1613.393 |                             -0.003 |
|  memory-array-1000 |              read-index |    mutative |     on |      on |                           1374.330 |                              1.840 |
|  memory-array-1000 |              read-index | mutative-v1 |     on |      on |                           1375.804 |                              1.840 |
|  memory-array-1000 |              read-index |       immer |     on |      on |                           1579.978 |                              0.135 |
|  memory-array-1000 | array-reverse-primitive |    mutative |    off |     off |                            141.210 |                              7.911 |
|  memory-array-1000 | array-reverse-primitive | mutative-v1 |    off |     off |                            138.927 |                              7.911 |
|  memory-array-1000 | array-reverse-primitive |       immer |    off |     off |                            242.485 |                              7.895 |
|  memory-array-1000 | array-reverse-primitive |    mutative |    off |      on |                            409.221 |                            186.440 |
|  memory-array-1000 | array-reverse-primitive | mutative-v1 |    off |      on |                            409.937 |                            186.456 |
|  memory-array-1000 | array-reverse-primitive |       immer |    off |      on |                            487.242 |                            184.456 |
|  memory-array-1000 | array-reverse-primitive |    mutative |     on |     off |                            180.249 |                              9.969 |
|  memory-array-1000 | array-reverse-primitive | mutative-v1 |     on |     off |                            182.099 |                              9.980 |
|  memory-array-1000 | array-reverse-primitive |       immer |     on |     off |                            239.569 |                              9.973 |
|  memory-array-1000 | array-reverse-primitive |    mutative |     on |      on |                            481.328 |                            186.313 |
|  memory-array-1000 | array-reverse-primitive | mutative-v1 |     on |      on |                            477.580 |                            186.297 |
|  memory-array-1000 | array-reverse-primitive |       immer |     on |      on |                            487.399 |                            184.536 |
|  memory-array-1000 |    array-reverse-nested |    mutative |    off |     off |                           1240.807 |                              6.303 |
|  memory-array-1000 |    array-reverse-nested | mutative-v1 |    off |     off |                           1239.056 |                              6.293 |
|  memory-array-1000 |    array-reverse-nested |       immer |    off |     off |                           1305.890 |                             11.995 |
|  memory-array-1000 |    array-reverse-nested |    mutative |    off |      on |                          26741.213 |                            996.427 |
|  memory-array-1000 |    array-reverse-nested | mutative-v1 |    off |      on |                          26755.843 |                            996.458 |
|  memory-array-1000 |    array-reverse-nested |       immer |    off |      on |                           1538.730 |                            184.450 |
|  memory-array-1000 |    array-reverse-nested |    mutative |     on |     off |                           1276.164 |                              6.862 |
|  memory-array-1000 |    array-reverse-nested | mutative-v1 |     on |     off |                           1282.801 |                              6.852 |
|  memory-array-1000 |    array-reverse-nested |       immer |     on |     off |                           1317.748 |                             11.967 |
|  memory-array-1000 |    array-reverse-nested |    mutative |     on |      on |                          26958.863 |                            996.276 |
|  memory-array-1000 |    array-reverse-nested | mutative-v1 |     on |      on |                          26920.550 |                            996.462 |
|  memory-array-1000 |    array-reverse-nested |       immer |     on |      on |                           1545.526 |                            184.457 |
| memory-array-10000 |              read-index |    mutative |    off |     off |                          13565.461 |                              3.414 |
| memory-array-10000 |              read-index | mutative-v1 |    off |     off |                          13507.894 |                              3.405 |
| memory-array-10000 |              read-index |       immer |    off |     off |                          15778.995 |                             -0.007 |
| memory-array-10000 |              read-index |    mutative |    off |      on |                          13518.594 |                              3.583 |
| memory-array-10000 |              read-index | mutative-v1 |    off |      on |                          13504.592 |                              3.552 |
| memory-array-10000 |              read-index |       immer |    off |      on |                          15741.095 |                              0.138 |
| memory-array-10000 |              read-index |    mutative |     on |     off |                          13564.317 |                              3.405 |
| memory-array-10000 |              read-index | mutative-v1 |     on |     off |                          13530.058 |                              3.405 |
| memory-array-10000 |              read-index |       immer |     on |     off |                          15728.705 |                             -0.007 |
| memory-array-10000 |              read-index |    mutative |     on |      on |                          13474.671 |                              3.711 |
| memory-array-10000 |              read-index | mutative-v1 |     on |      on |                          13494.373 |                              3.711 |
| memory-array-10000 |              read-index |       immer |     on |      on |                          15739.942 |                              0.138 |
| memory-array-10000 | array-reverse-primitive |    mutative |    off |     off |                           1208.647 |                             82.369 |
| memory-array-10000 | array-reverse-primitive | mutative-v1 |    off |     off |                           1205.430 |                             82.390 |
| memory-array-10000 | array-reverse-primitive |       immer |    off |     off |                           2451.259 |                             78.204 |
| memory-array-10000 | array-reverse-primitive |    mutative |    off |      on |                           3866.244 |                           1801.644 |
| memory-array-10000 | array-reverse-primitive | mutative-v1 |    off |      on |                           3862.613 |                           1801.664 |
| memory-array-10000 | array-reverse-primitive |       immer |    off |      on |                           4930.011 |                           1796.341 |
| memory-array-10000 | array-reverse-primitive |    mutative |     on |     off |                           1605.194 |                             82.256 |
| memory-array-10000 | array-reverse-primitive | mutative-v1 |     on |     off |                           1603.230 |                             82.292 |
| memory-array-10000 | array-reverse-primitive |       immer |     on |     off |                           2456.801 |                             78.219 |
| memory-array-10000 | array-reverse-primitive |    mutative |     on |      on |                           4281.089 |                           1801.538 |
| memory-array-10000 | array-reverse-primitive | mutative-v1 |     on |      on |                           4245.350 |                           1801.553 |
| memory-array-10000 | array-reverse-primitive |       immer |     on |      on |                           4970.566 |                           1797.414 |
| memory-array-10000 |    array-reverse-nested |    mutative |    off |     off |                          11178.403 |                             85.862 |
| memory-array-10000 |    array-reverse-nested | mutative-v1 |    off |     off |                          11160.165 |                             85.880 |
| memory-array-10000 |    array-reverse-nested |       immer |    off |     off |                          12863.212 |                             78.204 |
| memory-array-10000 |    array-reverse-nested |    mutative |    off |      on |                         268327.680 |                           9890.826 |
| memory-array-10000 |    array-reverse-nested | mutative-v1 |    off |      on |                         268375.703 |                           9890.852 |
| memory-array-10000 |    array-reverse-nested |       immer |    off |      on |                          14807.871 |                           1797.399 |
| memory-array-10000 |    array-reverse-nested |    mutative |     on |     off |                          11485.648 |                             85.779 |
| memory-array-10000 |    array-reverse-nested | mutative-v1 |     on |     off |                          11498.741 |                             85.804 |
| memory-array-10000 |    array-reverse-nested |       immer |     on |     off |                          12843.299 |                             78.219 |
| memory-array-10000 |    array-reverse-nested |    mutative |     on |      on |                         269769.935 |                           9890.801 |
| memory-array-10000 |    array-reverse-nested | mutative-v1 |     on |      on |                         269919.731 |                           9890.819 |
| memory-array-10000 |    array-reverse-nested |       immer |     on |      on |                          14783.373 |                           1797.418 |

## Findings and optimization priorities

- These are current-candidate and pinned-v1 results, not evidence of a v2 improvement. Both report version 1.3.0, with separate production hashes and generally similar measurements.
- Workload and mode matter. At 10,000 rows, indexed nested-value traversal is 8.09–8.21 ms for the candidate and 12.54–13.04 ms for Immer across the four freeze/patch modes (I/C 1.53–1.61). At the small-object size with both modes off, Immer takes 0.888 µs versus the candidate's 1.157 µs. At 1,000 rows, a 100% mutation with both modes off takes 1.243 ms versus 1.022 ms; at 10,000 rows it is near parity. These examples do not support a universal winner.
- Nested array movement with patches enabled is the strongest optimization target. At 10,000 rows and freeze off, shift, unshift, middle splice insertion, and reverse take approximately 23–24 times Immer's time. Reverse takes 281.062 ms versus 11.970 ms; with freeze on it takes 288.795 ms versus 13.031 ms. The previous [source-mapped profile](./2026-09-30-m1-max-node24-patches-summary.md) identifies patch-value deep cloning as a major hotspot. Fixtures differ between the original and expanded reports, so compare each dataset with its own controls.
- Memory independently supports that priority. At 10,000 rows with freeze off and patches on, nested reverse estimates 262.039 MiB allocated per iteration for the candidate versus 14.461 MiB for Immer, and 9.659 versus 1.755 MiB of retained-output heap. The primitive-element counterpart estimates 3.776 versus 4.814 MiB allocated, with approximately equal retained output. Element shape must remain a separate axis when optimizing patches.
- After the array-patch hotspot, investigate small-state producer overhead and dense-write allocations. For 10,000-row 100% mutation with freeze/patches off, the candidate estimates 21.462 MiB allocated and 1.150 MiB retained per output versus Immer's 16.225 and 0.839 MiB, despite comparable execution time. Keep independent correctness, read/no-op, freeze, and patch-replay checks when assessing each optimization.

## CI budgets and controls

The versioned policy checks eight representative latency scenarios with five paired repetitions and two memory scenarios with three repetitions. Both freeze and patch modes run separately. Latency fails above 1.30x and 500 ns; allocation above 1.35x and 8 KiB/output; retained-output heap above 1.35x and 1 KiB/output. Both relative and absolute limits must be exceeded. These are conservative shared-runner guardrails, not universal performance targets.

[Local same-build calibration](./2026-09-30-m1-max-node24-expanded-budgets-local.md) / [JSON](./2026-09-30-m1-max-node24-expanded-budgets-local.json); [GitHub base/head measurements](./2026-09-30-m1-max-node24-expanded-budgets-github.md) / [JSON](./2026-09-30-m1-max-node24-expanded-budgets-github.json) from [run 36733040462](https://github.com/unadlib/mutative/actions/runs/36733040462). Each control contains 320 timing trials and 48 isolated memory workers, with 48 budget decisions, all passing. Local and GitHub data are separate environments and must not be pooled for speed comparisons.

The local same-build paired median ratios span 0.992–1.033 for latency, 0.995–1.005 for allocation, and 0.9997–1.0002 for retained output. The GitHub control spans 0.948–1.093, 0.979–1.004, and 1.000–1.121 respectively. This observed noise supports retaining the initial conservative budgets until repeated CI history permits tighter limits.

The same-build preflight caught persistent JIT/cache growth contaminating a before-only heap baseline; output heap now uses the released-output snapshot and raw snapshots are retained. GitHub also exercised slow trials with 9–10 retained samples after Mitata outlier trimming; the pinned sampler policy accepts valid retained counts while rejecting missing or insufficient evidence. These measurement fixes are covered by focused tests.

## Reproduce and future coverage

Use a clean checkout of `ea629e1` to reproduce the archived build. Install the frozen lockfile and build once, then run these commands sequentially. See [the benchmark guide](../README.md) for all options.

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm benchmark:immer:build
node perf-testing/run-benchmarks.mjs --runs 3 --patches both --output perf-testing/results/expanded-default.json
node perf-testing/run-benchmarks.mjs --runs 3 --patches both --array-size 1000 --filter '^(read-index|read-forEach|read-missing|mutation-density-100pct|array-shift-nested|array-unshift-nested|array-splice-insert-nested|array-reverse-nested|array-reverse-primitive)$' --output perf-testing/results/expanded-array-1000.json
node perf-testing/run-benchmarks.mjs --runs 3 --patches both --array-size 10000 --filter '^(read-index|read-forEach|read-missing|mutation-density-100pct|array-shift-nested|array-unshift-nested|array-splice-insert-nested|array-reverse-nested|array-reverse-primitive)$' --output perf-testing/results/expanded-array-10000.json
node perf-testing/run-memory.mjs --runs 3 --patches both --memory-iterations 32 --filter '^(small-object-update|noop-empty|read-index|mutation-density-100pct|array-reverse-primitive|array-reverse-nested)$' --output perf-testing/results/expanded-memory-default.json
node perf-testing/run-memory.mjs --runs 3 --patches both --array-size 1000 --memory-iterations 16 --filter '^(read-index|mutation-density-100pct|array-reverse-primitive|array-reverse-nested)$' --output perf-testing/results/expanded-memory-array-1000.json
node perf-testing/run-memory.mjs --runs 3 --patches both --array-size 10000 --memory-iterations 8 --filter '^(read-index|mutation-density-100pct|array-reverse-primitive|array-reverse-nested)$' --output perf-testing/results/expanded-memory-array-10000.json
node perf-testing/ci.mjs --self-control --output perf-testing/results/expanded-ci-control
```

For a base/head CI comparison, build the base checkout first and use `node perf-testing/ci.mjs --base-dir /absolute/path/to/base-checkout`.

Read-only/no-op producers, genuinely small states, primitive/shallow/nested common array operations, and mutation density are now implemented. Additional dimensions remain cold/incoming-data freezing, patch application/serialization/byte sizes, Map/Set, sparse arrays, deeper object paths, and browser engines. Actual v2 measurements can be added once its implementation is ready. The existing wide-object insertion case remains process/order-sensitive; use single-library runs before claiming a stable gain from its pooled median.
