# Memory measurements

Recorded: 2026-10-01T10:32:40.462Z; 144 isolated worker processes. Candidate Mutative 1.3.0, pinned v1 1.3.0, Immer 11.1.18; Node v24.16.0, V8 13.6.233.17-node.49, Apple M1 Max.

Each worker owns one scenario/library/freeze/patch combination. Setup, validation, and five warmup calls precede measurement. Allocation sampling includes collected objects and profiler/loop overhead; estimates are not exact allocation counts. A separate unprofiled pass retains one result per iteration (the last producer tuple when patches are enabled). Retained-output heap compares post-GC snapshots with outputs live and after releasing them, cancelling persistent runtime-cache growth. Raw before/retained/released snapshots remain in JSON. Small or negative deltas can be measurement noise. RSS is a batch-end snapshot delta, not peak RSS or per-operation allocation. Explicit GC duration is diagnostic, not producer latency.

Iterations/pass: 16; allocation sampling interval: 1024 bytes. Freeze on uses pre-frozen inputs. Patch application and serialization are excluded. Array-method plugins are disabled.

| Scenario | Library | Freeze | Patches | Allocated KiB/iteration (estimate) | Retained heap KiB/iteration | Batch RSS delta MiB | Explicit GC ms |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: |
| read-index | mutative | off | off | 993.655 | 0.000 | 0.219 | 1.681 |
| read-index | mutative-v1 | off | off | 1368.552 | 1.707 | 0.188 | 1.453 |
| read-index | immer | off | off | 1603.236 | -0.003 | 0.594 | 1.654 |
| read-index | mutative | off | on | 988.104 | 0.131 | 0.234 | 1.704 |
| read-index | mutative-v1 | off | on | 1381.911 | 1.836 | 0.031 | 1.448 |
| read-index | immer | off | on | 1592.562 | 0.135 | 0.063 | 1.463 |
| read-index | mutative | on | off | 984.486 | 0.000 | 3.453 | 1.381 |
| read-index | mutative-v1 | on | off | 1378.885 | 1.707 | 0.047 | 1.728 |
| read-index | immer | on | off | 1595.595 | -0.003 | 0.234 | 1.893 |
| read-index | mutative | on | on | 995.016 | 0.131 | 0.000 | 1.514 |
| read-index | mutative-v1 | on | on | 1378.767 | 1.840 | 0.234 | 1.644 |
| read-index | immer | on | on | 1597.444 | 0.135 | 0.047 | 1.467 |
| mutation-density-100pct | mutative | off | off | 1512.655 | 86.021 | 0.828 | 2.075 |
| mutation-density-100pct | mutative-v1 | off | off | 2266.880 | 119.948 | 17.828 | 2.450 |
| mutation-density-100pct | immer | off | off | 1820.099 | 86.020 | 2.891 | 2.228 |
| mutation-density-100pct | mutative | off | on | 2184.373 | 266.191 | 8.484 | 3.343 |
| mutation-density-100pct | mutative-v1 | off | on | 2982.721 | 313.215 | 8.453 | 3.556 |
| mutation-density-100pct | immer | off | on | 2720.753 | 278.200 | 3.781 | 3.352 |
| mutation-density-100pct | mutative | on | off | 1923.344 | 86.032 | 1.094 | 2.317 |
| mutation-density-100pct | mutative-v1 | on | off | 2617.043 | 120.049 | 19.203 | 2.467 |
| mutation-density-100pct | immer | on | off | 2245.315 | 86.031 | 16.188 | 2.859 |
| mutation-density-100pct | mutative | on | on | 2595.554 | 265.562 | 4.125 | 4.331 |
| mutation-density-100pct | mutative-v1 | on | on | 3356.400 | 313.273 | 13.641 | 4.140 |
| mutation-density-100pct | immer | on | on | 3157.535 | 278.210 | 11.828 | 3.267 |
| array-reverse-primitive | mutative | off | off | 177.547 | 7.897 | 0.031 | 1.369 |
| array-reverse-primitive | mutative-v1 | off | off | 140.777 | 7.911 | 0.063 | 1.547 |
| array-reverse-primitive | immer | off | off | 239.620 | 7.895 | 0.234 | 1.209 |
| array-reverse-primitive | mutative | off | on | 498.255 | 184.450 | 3.672 | 2.242 |
| array-reverse-primitive | mutative-v1 | off | on | 405.783 | 186.425 | 2.734 | 2.414 |
| array-reverse-primitive | immer | off | on | 486.765 | 184.456 | 5.047 | 2.009 |
| array-reverse-primitive | mutative | on | off | 218.713 | 7.904 | 0.000 | 1.259 |
| array-reverse-primitive | mutative-v1 | on | off | 181.171 | 9.982 | 0.688 | 1.384 |
| array-reverse-primitive | immer | on | off | 241.754 | 9.978 | 0.047 | 1.358 |
| array-reverse-primitive | mutative | on | on | 574.559 | 184.457 | 4.266 | 2.325 |
| array-reverse-primitive | mutative-v1 | on | on | 484.147 | 186.297 | 3.281 | 2.471 |
| array-reverse-primitive | immer | on | on | 489.546 | 184.536 | 3.188 | 2.439 |
| array-reverse-nested | mutative | off | off | 828.497 | 7.898 | 0.734 | 1.507 |
| array-reverse-nested | mutative-v1 | off | off | 1231.097 | 6.295 | 7.953 | 2.055 |
| array-reverse-nested | immer | off | off | 1312.783 | 12.000 | 0.094 | 1.845 |
| array-reverse-nested | mutative | off | on | 1177.465 | 184.451 | 7.516 | 2.347 |
| array-reverse-nested | mutative-v1 | off | on | 26822.507 | 996.429 | 21.250 | 7.774 |
| array-reverse-nested | immer | off | on | 1566.906 | 184.450 | 5.500 | 3.608 |
| array-reverse-nested | mutative | on | off | 860.553 | 7.902 | 5.844 | 1.794 |
| array-reverse-nested | mutative-v1 | on | off | 1288.019 | 6.858 | 7.906 | 1.595 |
| array-reverse-nested | immer | on | off | 1315.960 | 11.962 | 0.047 | 1.634 |
| array-reverse-nested | mutative | on | on | 1218.816 | 184.458 | 0.078 | 2.739 |
| array-reverse-nested | mutative-v1 | on | on | 26895.382 | 996.465 | 20.969 | 7.035 |
| array-reverse-nested | immer | on | on | 1551.165 | 184.457 | 5.406 | 3.041 |

Tables use medians across independent workers. JSON retains every snapshot, process range, source/production hashes, patch counts, and sampling count. Compare latency using the separate timing reports.
