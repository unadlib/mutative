# Memory measurements

Recorded: 2026-09-30T15:57:30.378Z; 144 isolated worker processes. Candidate Mutative 1.3.0, pinned v1 1.3.0, Immer 11.1.18; Node v24.16.0, V8 13.6.233.17-node.49, Apple M1 Max.

Each worker owns one scenario/library/freeze/patch combination. Setup, validation, and five warmup calls precede measurement. Allocation sampling includes collected objects and profiler/loop overhead; estimates are not exact allocation counts. A separate unprofiled pass retains one result per iteration (the last producer tuple when patches are enabled). Retained-output heap compares post-GC snapshots with outputs live and after releasing them, cancelling persistent runtime-cache growth. Raw before/retained/released snapshots remain in JSON. Small or negative deltas can be measurement noise. RSS is a batch-end snapshot delta, not peak RSS or per-operation allocation. Explicit GC duration is diagnostic, not producer latency.

Iterations/pass: 8; allocation sampling interval: 1024 bytes. Freeze on uses pre-frozen inputs. Patch application and serialization are excluded. Array-method plugins are disabled.

| Scenario                | Library     | Freeze | Patches | Allocated KiB/iteration (estimate) | Retained heap KiB/iteration | Batch RSS delta MiB | Explicit GC ms |
| ----------------------- | ----------- | ------ | ------- | ---------------------------------: | --------------------------: | ------------------: | -------------: |
| read-index              | mutative    | off    | off     |                          13565.461 |                       3.414 |              21.875 |          2.973 |
| read-index              | mutative-v1 | off    | off     |                          13507.894 |                       3.405 |              37.750 |          3.217 |
| read-index              | immer       | off    | off     |                          15778.995 |                      -0.007 |               5.609 |          3.310 |
| read-index              | mutative    | off    | on      |                          13518.594 |                       3.583 |               1.594 |          3.211 |
| read-index              | mutative-v1 | off    | on      |                          13504.592 |                       3.552 |               1.578 |          3.270 |
| read-index              | immer       | off    | on      |                          15741.095 |                       0.138 |               0.984 |          3.446 |
| read-index              | mutative    | on     | off     |                          13564.317 |                       3.405 |              33.406 |          3.270 |
| read-index              | mutative-v1 | on     | off     |                          13530.058 |                       3.405 |              33.391 |          3.024 |
| read-index              | immer       | on     | off     |                          15728.705 |                      -0.007 |               6.000 |          4.018 |
| read-index              | mutative    | on     | on      |                          13474.671 |                       3.711 |               3.078 |          3.089 |
| read-index              | mutative-v1 | on     | on      |                          13494.373 |                       3.711 |               3.094 |          3.395 |
| read-index              | immer       | on     | on      |                          15739.942 |                       0.138 |               1.203 |          2.981 |
| mutation-density-100pct | mutative    | off    | off     |                          21976.934 |                    1178.016 |               0.844 |          6.532 |
| mutation-density-100pct | mutative-v1 | off    | off     |                          22020.341 |                    1178.035 |               0.859 |          6.095 |
| mutation-density-100pct | immer       | off    | off     |                          16614.834 |                     859.454 |               0.438 |          5.524 |
| mutation-density-100pct | mutative    | off    | on      |                          27805.671 |                    3054.966 |               5.531 |         11.299 |
| mutation-density-100pct | mutative-v1 | off    | on      |                          27884.735 |                    3054.997 |               5.469 |         12.141 |
| mutation-density-100pct | immer       | off    | on      |                          25473.365 |                    2734.899 |               5.797 |          9.517 |
| mutation-density-100pct | mutative    | on     | off     |                          26015.783 |                    1178.136 |               1.234 |          6.119 |
| mutation-density-100pct | mutative-v1 | on     | off     |                          25497.409 |                    1178.158 |               0.859 |          4.990 |
| mutation-density-100pct | immer       | on     | off     |                          20715.358 |                     859.479 |               2.219 |          6.661 |
| mutation-density-100pct | mutative    | on     | on      |                          31857.222 |                    3055.080 |               5.297 |         11.142 |
| mutation-density-100pct | mutative-v1 | on     | on      |                          31376.033 |                    3055.119 |               5.563 |         12.902 |
| mutation-density-100pct | immer       | on     | on      |                          29840.405 |                    2734.921 |               5.094 |          8.068 |
| array-reverse-primitive | mutative    | off    | off     |                           1208.647 |                      82.369 |               1.563 |          1.601 |
| array-reverse-primitive | mutative-v1 | off    | off     |                           1205.430 |                      82.390 |               1.672 |          1.696 |
| array-reverse-primitive | immer       | off    | off     |                           2451.259 |                      78.204 |               8.344 |          1.956 |
| array-reverse-primitive | mutative    | off    | on      |                           3866.244 |                    1801.644 |               8.391 |          5.893 |
| array-reverse-primitive | mutative-v1 | off    | on      |                           3862.613 |                    1801.664 |               8.234 |          5.204 |
| array-reverse-primitive | immer       | off    | on      |                           4930.011 |                    1796.341 |              24.422 |          7.454 |
| array-reverse-primitive | mutative    | on     | off     |                           1605.194 |                      82.256 |               3.766 |          1.746 |
| array-reverse-primitive | mutative-v1 | on     | off     |                           1603.230 |                      82.292 |               3.828 |          1.835 |
| array-reverse-primitive | immer       | on     | off     |                           2456.801 |                      78.219 |               8.344 |          1.864 |
| array-reverse-primitive | mutative    | on     | on      |                           4281.089 |                    1801.538 |              17.484 |          7.311 |
| array-reverse-primitive | mutative-v1 | on     | on      |                           4245.350 |                    1801.553 |              16.516 |          7.222 |
| array-reverse-primitive | immer       | on     | on      |                           4970.566 |                    1797.414 |              11.688 |          6.502 |
| array-reverse-nested    | mutative    | off    | off     |                          11178.403 |                      85.862 |               2.797 |          2.815 |
| array-reverse-nested    | mutative-v1 | off    | off     |                          11160.165 |                      85.880 |               2.781 |          3.542 |
| array-reverse-nested    | immer       | off    | off     |                          12863.212 |                      78.204 |              35.328 |          3.901 |
| array-reverse-nested    | mutative    | off    | on      |                         268327.680 |                    9890.826 |             174.172 |         42.114 |
| array-reverse-nested    | mutative-v1 | off    | on      |                         268375.703 |                    9890.852 |             174.547 |         38.945 |
| array-reverse-nested    | immer       | off    | on      |                          14807.871 |                    1797.399 |               9.391 |          8.383 |
| array-reverse-nested    | mutative    | on     | off     |                          11485.648 |                      85.779 |               3.609 |          3.344 |
| array-reverse-nested    | mutative-v1 | on     | off     |                          11498.741 |                      85.804 |               3.563 |          3.410 |
| array-reverse-nested    | immer       | on     | off     |                          12843.299 |                      78.219 |              34.844 |          3.081 |
| array-reverse-nested    | mutative    | on     | on      |                         269769.935 |                    9890.801 |             173.516 |         36.847 |
| array-reverse-nested    | mutative-v1 | on     | on      |                         269919.731 |                    9890.819 |             188.672 |         30.447 |
| array-reverse-nested    | immer       | on     | on      |                          14783.373 |                    1797.418 |               9.344 |          7.240 |

Tables use medians across independent workers. JSON retains every snapshot, process range, source/production hashes, patch counts, and sampling count. Compare latency using the separate timing reports.
