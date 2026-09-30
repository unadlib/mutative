# Memory measurements

Recorded: 2026-09-30T15:52:39.586Z; 144 isolated worker processes. Candidate Mutative 1.3.0, pinned v1 1.3.0, Immer 11.1.18; Node v24.16.0, V8 13.6.233.17-node.49, Apple M1 Max.

Each worker owns one scenario/library/freeze/patch combination. Setup, validation, and five warmup calls precede measurement. Allocation sampling includes collected objects and profiler/loop overhead; estimates are not exact allocation counts. A separate unprofiled pass retains one result per iteration (the last producer tuple when patches are enabled). Retained-output heap compares post-GC snapshots with outputs live and after releasing them, cancelling persistent runtime-cache growth. Raw before/retained/released snapshots remain in JSON. Small or negative deltas can be measurement noise. RSS is a batch-end snapshot delta, not peak RSS or per-operation allocation. Explicit GC duration is diagnostic, not producer latency.

Iterations/pass: 16; allocation sampling interval: 1024 bytes. Freeze on uses pre-frozen inputs. Patch application and serialization are excluded. Array-method plugins are disabled.

| Scenario                | Library     | Freeze | Patches | Allocated KiB/iteration (estimate) | Retained heap KiB/iteration | Batch RSS delta MiB | Explicit GC ms |
| ----------------------- | ----------- | ------ | ------- | ---------------------------------: | --------------------------: | ------------------: | -------------: |
| read-index              | mutative    | off    | off     |                           1377.313 |                       1.707 |               0.047 |          1.581 |
| read-index              | mutative-v1 | off    | off     |                           1377.531 |                       1.707 |               0.266 |          1.671 |
| read-index              | immer       | off    | off     |                           1590.069 |                      -0.003 |               0.469 |          1.687 |
| read-index              | mutative    | off    | on      |                           1377.093 |                       1.840 |               0.047 |          1.778 |
| read-index              | mutative-v1 | off    | on      |                           1383.951 |                       1.840 |               0.047 |          1.512 |
| read-index              | immer       | off    | on      |                           1599.995 |                       0.135 |               0.047 |          1.841 |
| read-index              | mutative    | on     | off     |                           1379.874 |                       1.707 |               0.063 |          1.778 |
| read-index              | mutative-v1 | on     | off     |                           1374.651 |                       1.707 |               0.047 |          1.531 |
| read-index              | immer       | on     | off     |                           1613.393 |                      -0.003 |               0.234 |          1.800 |
| read-index              | mutative    | on     | on      |                           1374.330 |                       1.840 |               0.094 |          1.505 |
| read-index              | mutative-v1 | on     | on      |                           1375.804 |                       1.840 |               0.094 |          1.884 |
| read-index              | immer       | on     | on      |                           1579.978 |                       0.135 |               0.109 |          1.984 |
| mutation-density-100pct | mutative    | off    | off     |                           2145.743 |                     119.939 |              16.594 |          2.628 |
| mutation-density-100pct | mutative-v1 | off    | off     |                           2265.132 |                     119.949 |              17.844 |          2.901 |
| mutation-density-100pct | immer       | off    | off     |                           1802.204 |                      86.020 |               2.375 |          2.616 |
| mutation-density-100pct | mutative    | off    | on      |                           2998.994 |                     313.199 |               8.000 |          4.104 |
| mutation-density-100pct | mutative-v1 | off    | on      |                           3002.333 |                     313.217 |               7.781 |          3.311 |
| mutation-density-100pct | immer       | off    | on      |                           2722.774 |                     278.200 |               4.078 |          3.177 |
| mutation-density-100pct | mutative    | on     | off     |                           2684.456 |                     120.042 |              19.344 |          3.165 |
| mutation-density-100pct | mutative-v1 | on     | off     |                           2499.657 |                     120.007 |              14.969 |          2.324 |
| mutation-density-100pct | immer       | on     | off     |                           2247.004 |                      86.031 |              16.469 |          2.925 |
| mutation-density-100pct | mutative    | on     | on      |                           3384.831 |                     313.257 |              14.781 |          4.173 |
| mutation-density-100pct | mutative-v1 | on     | on      |                           3341.280 |                     313.273 |              13.641 |          4.783 |
| mutation-density-100pct | immer       | on     | on      |                           3155.806 |                     278.210 |              13.797 |          4.295 |
| array-reverse-primitive | mutative    | off    | off     |                            141.210 |                       7.911 |               0.047 |          1.381 |
| array-reverse-primitive | mutative-v1 | off    | off     |                            138.927 |                       7.911 |               0.047 |          1.466 |
| array-reverse-primitive | immer       | off    | off     |                            242.485 |                       7.895 |               0.250 |          1.271 |
| array-reverse-primitive | mutative    | off    | on      |                            409.221 |                     186.440 |               2.719 |          2.550 |
| array-reverse-primitive | mutative-v1 | off    | on      |                            409.937 |                     186.456 |               2.734 |          2.497 |
| array-reverse-primitive | immer       | off    | on      |                            487.242 |                     184.456 |               5.375 |          2.178 |
| array-reverse-primitive | mutative    | on     | off     |                            180.249 |                       9.969 |               0.563 |          1.308 |
| array-reverse-primitive | mutative-v1 | on     | off     |                            182.099 |                       9.980 |               0.656 |          1.293 |
| array-reverse-primitive | immer       | on     | off     |                            239.569 |                       9.973 |               0.078 |          1.388 |
| array-reverse-primitive | mutative    | on     | on      |                            481.328 |                     186.313 |               3.297 |          2.906 |
| array-reverse-primitive | mutative-v1 | on     | on      |                            477.580 |                     186.297 |               3.313 |          2.984 |
| array-reverse-primitive | immer       | on     | on      |                            487.399 |                     184.536 |               3.203 |          2.766 |
| array-reverse-nested    | mutative    | off    | off     |                           1240.807 |                       6.303 |               8.359 |          2.211 |
| array-reverse-nested    | mutative-v1 | off    | off     |                           1239.056 |                       6.293 |               8.094 |          2.411 |
| array-reverse-nested    | immer       | off    | off     |                           1305.890 |                      11.995 |               0.063 |          1.543 |
| array-reverse-nested    | mutative    | off    | on      |                          26741.213 |                     996.427 |              20.828 |          7.551 |
| array-reverse-nested    | mutative-v1 | off    | on      |                          26755.843 |                     996.458 |              20.891 |          9.179 |
| array-reverse-nested    | immer       | off    | on      |                           1538.730 |                     184.450 |               5.453 |          3.069 |
| array-reverse-nested    | mutative    | on     | off     |                           1276.164 |                       6.862 |               7.141 |          2.380 |
| array-reverse-nested    | mutative-v1 | on     | off     |                           1282.801 |                       6.852 |               8.016 |          1.579 |
| array-reverse-nested    | immer       | on     | off     |                           1317.748 |                      11.967 |               0.281 |          2.219 |
| array-reverse-nested    | mutative    | on     | on      |                          26958.863 |                     996.276 |              21.000 |          7.967 |
| array-reverse-nested    | mutative-v1 | on     | on      |                          26920.550 |                     996.462 |              21.000 |          7.020 |
| array-reverse-nested    | immer       | on     | on      |                           1545.526 |                     184.457 |               5.234 |          3.851 |

Tables use medians across independent workers. JSON retains every snapshot, process range, source/production hashes, patch counts, and sampling count. Compare latency using the separate timing reports.
