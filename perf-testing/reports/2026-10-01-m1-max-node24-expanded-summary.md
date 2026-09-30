# Expanded versioned performance baseline: 2026-10-01 UTC

Candidate: draft fast paths candidate on this branch, `src/` as committed in `b519eca` and unchanged through `96880b7`, the last commit before the build and archive commits (the benchmark build recorded revision `027e23edd2145c8fb80d8f20e1a10e9bb30d7999`, the archive commit before it was amended with these results; package version 1.3.0); baseline: npm Mutative 1.3.0 (`mutative-v1`); Immer: pinned 11.1.18, still npm `latest` on 2026-10-01. Array-method plugins are disabled throughout. The candidate package version has not changed; only its source differs from the pinned v1 artifact.

Apple M1 Max, 64 GiB, darwin/arm64, Node v24.16.0 / V8 13.6.233.17-node.49. Timing and memory jobs ran sequentially after the local CI budget gate, with no concurrent local tests or profiling. Normal desktop activity remained present. Freeze on uses pre-frozen state and payloads, not cold incoming data.

## Datasets

|            Dataset |                      Scope | Workers | Measured trials |                                                                                                                             Tables / JSON |
| -----------------: | -------------------------: | ------: | --------------: | ----------------------------------------------------------------------------------------------------------------------------------------: |
|            default |           all 67 scenarios |       3 |            2412 |                       [Tables](./2026-10-01-m1-max-node24-expanded-default.md) / [JSON](./2026-10-01-m1-max-node24-expanded-default.json) |
|         array-1000 |        9 scaling scenarios |       3 |             324 |                 [Tables](./2026-10-01-m1-max-node24-expanded-array-1000.md) / [JSON](./2026-10-01-m1-max-node24-expanded-array-1000.json) |
|        array-10000 |        9 scaling scenarios |       3 |             324 |               [Tables](./2026-10-01-m1-max-node24-expanded-array-10000.md) / [JSON](./2026-10-01-m1-max-node24-expanded-array-10000.json) |
|     memory-default | 6 representative scenarios |     216 |             216 |         [Tables](./2026-10-01-m1-max-node24-expanded-memory-default.md) / [JSON](./2026-10-01-m1-max-node24-expanded-memory-default.json) |
|  memory-array-1000 | 4 representative scenarios |     144 |             144 |   [Tables](./2026-10-01-m1-max-node24-expanded-memory-array-1000.md) / [JSON](./2026-10-01-m1-max-node24-expanded-memory-array-1000.json) |
| memory-array-10000 | 4 representative scenarios |     144 |             144 | [Tables](./2026-10-01-m1-max-node24-expanded-memory-array-10000.md) / [JSON](./2026-10-01-m1-max-node24-expanded-memory-array-10000.json) |

The comparison datasets contain **3,060 timing trials in 9 independent processes** and **504 isolated memory workers**. Each selected scenario/library/freeze/patch combination passes correctness validation before measurement. Timing tables use medians of independent-process means. Memory tables use medians across three independent workers per combination. Every dataset uses the same clean benchmark build and production artifact hashes.

## Outcome by dataset and mode

Each cell compares one scenario in one freeze/patch mode. "Faster" means the candidate median is at least 5% lower than the other library; "tie" is within ±5%. The 2026-09-30 column compares the candidate with the archived candidate measurement of the unoptimized 1.3.0 source on the same harness and machine. Geometric means summarize ratios only; scenario counts are not an application-weighted score.

|     Dataset | Mode                    | Scenarios | vs Immer faster / tie / slower | Geomean I/C | vs pinned v1 faster / tie / slower | Geomean v1/C | vs 2026-09-30 candidate faster / tie / slower | Geomean speedup |
| ----------: | ----------------------- | --------: | -----------------------------: | ----------: | ---------------------------------: | -----------: | --------------------------------------------: | --------------: |
|     default | freeze off, patches off |        67 |                     67 / 0 / 0 |        1.52 |                         65 / 2 / 0 |         1.69 |                                    67 / 0 / 0 |           1.71× |
|     default | freeze off, patches on  |        67 |                     67 / 0 / 0 |        1.75 |                         67 / 0 / 0 |         3.52 |                                    67 / 0 / 0 |           3.59× |
|     default | freeze on, patches off  |        67 |                     65 / 2 / 0 |        1.76 |                         66 / 1 / 0 |         1.50 |                                    64 / 3 / 0 |           1.51× |
|     default | freeze on, patches on   |        67 |                     67 / 0 / 0 |        1.84 |                         64 / 2 / 1 |         2.96 |                                    67 / 0 / 0 |           3.02× |
|  array-1000 | freeze off, patches off |         9 |                      9 / 0 / 0 |        1.53 |                          9 / 0 / 0 |         1.68 |                                     9 / 0 / 0 |           1.70× |
|  array-1000 | freeze off, patches on  |         9 |                      9 / 0 / 0 |        1.46 |                          9 / 0 / 0 |         6.64 |                                     9 / 0 / 0 |           6.74× |
|  array-1000 | freeze on, patches off  |         9 |                      9 / 0 / 0 |        1.63 |                          9 / 0 / 0 |         1.63 |                                     9 / 0 / 0 |           1.65× |
|  array-1000 | freeze on, patches on   |         9 |                      9 / 0 / 0 |        1.54 |                          9 / 0 / 0 |         6.43 |                                     9 / 0 / 0 |           6.64× |
| array-10000 | freeze off, patches off |         9 |                      9 / 0 / 0 |        1.55 |                          9 / 0 / 0 |         1.67 |                                     9 / 0 / 0 |           1.67× |
| array-10000 | freeze off, patches on  |         9 |                      9 / 0 / 0 |        1.49 |                          9 / 0 / 0 |         6.37 |                                     9 / 0 / 0 |           6.52× |
| array-10000 | freeze on, patches off  |         9 |                      9 / 0 / 0 |        1.63 |                          9 / 0 / 0 |         1.66 |                                     9 / 0 / 0 |           1.65× |
| array-10000 | freeze on, patches on   |         9 |                      9 / 0 / 0 |        1.54 |                          9 / 0 / 0 |         6.22 |                                     9 / 0 / 0 |           6.41× |
|     **all** |                         |       340 |                    338 / 2 / 0 |        1.68 |                        334 / 5 / 1 |         2.45 |                                   337 / 3 / 0 |           2.49× |

Cells where the candidate is not at least 5% faster than Immer:

| Dataset |   Scenario | Freeze | Patches | Candidate µs | Immer µs |   I/C |
| ------: | ---------: | -----: | ------: | -----------: | -------: | ----: |
| default |     concat |     on |     off |       19.777 |   19.770 | 1.000 |
| default | noop-empty |     on |     off |        0.276 |    0.289 | 1.050 |

## Selected timing comparisons

Times are microseconds per full scenario. I/C = Immer time divided by candidate time; v1/C = pinned v1.3.0 time divided by candidate time; above 1 favors the candidate. The 2026-09-30 column is the archived candidate measurement of the unoptimized source. These rows compare identical fixtures and modes. Small differences near parity do not establish a decisive winner. Full tables retain all cases, with process ranges and sample statistics in JSON.

|     Dataset |                Scenario | Freeze | Patches | Candidate µs | Pinned v1 µs |  Immer µs |   v1/C |   I/C | 2026-09-30 candidate µs | Speedup |
| ----------: | ----------------------: | -----: | ------: | -----------: | -----------: | --------: | -----: | ----: | ----------------------: | ------: |
|     default |     small-object-update |    off |     off |        0.638 |        1.135 |     0.874 |  1.781 | 1.371 |                   1.157 |   1.81× |
|     default |    small-array-1-update |    off |     off |        0.880 |        1.726 |     1.265 |  1.962 | 1.438 |                   1.752 |   1.99× |
|     default |   small-array-10-update |    off |     off |        0.883 |        1.711 |     1.262 |  1.938 | 1.429 |                   1.743 |   1.97× |
|     default |              noop-empty |    off |     off |        0.261 |        0.319 |     0.281 |  1.223 | 1.078 |                   0.322 |   1.23× |
|     default |              read-index |    off |     off |       49.096 |       77.206 |    95.463 |  1.573 | 1.944 |                  78.133 |   1.59× |
|     default |           rtkq-sequence |    off |     off |     1033.135 |     1768.433 |  1176.822 |  1.712 | 1.139 |                2053.573 |   1.99× |
|     default |     update-largeObject1 |    off |     off |       54.695 |       55.502 |   195.478 |  1.015 | 3.574 |                  61.414 |   1.12× |
|     default |          mixed-sequence |    off |     off |       50.187 |       97.434 |    77.186 |  1.941 | 1.538 |                  98.425 |   1.96× |
|  array-1000 |              read-index |    off |     off |      513.697 |      769.452 |   923.764 |  1.498 | 1.798 |                 782.096 |   1.52× |
|  array-1000 |              read-index |    off |      on |      512.933 |      772.701 |   926.842 |  1.506 | 1.807 |                 783.435 |   1.53× |
|  array-1000 |              read-index |     on |     off |      516.586 |      775.191 |   959.492 |  1.501 | 1.857 |                 786.008 |   1.52× |
|  array-1000 |              read-index |     on |      on |      516.545 |      775.678 |   953.833 |  1.502 | 1.847 |                 788.849 |   1.53× |
|  array-1000 | mutation-density-100pct |    off |     off |      638.857 |     1225.375 |  1010.769 |  1.918 | 1.582 |                1243.233 |   1.95× |
|  array-1000 | mutation-density-100pct |    off |      on |     1080.810 |     2012.303 |  1893.681 |  1.862 | 1.752 |                2005.610 |   1.86× |
|  array-1000 | mutation-density-100pct |     on |     off |      815.576 |     1399.206 |  1376.950 |  1.716 | 1.688 |                1416.805 |   1.74× |
|  array-1000 | mutation-density-100pct |     on |      on |     1242.908 |     2167.605 |  2270.738 |  1.744 | 1.827 |                2160.031 |   1.74× |
|  array-1000 | array-reverse-primitive |    off |     off |      269.601 |      415.334 |   416.582 |  1.541 | 1.545 |                 415.997 |   1.54× |
|  array-1000 | array-reverse-primitive |    off |      on |      443.759 |      550.853 |   597.877 |  1.241 | 1.347 |                 552.388 |   1.24× |
|  array-1000 | array-reverse-primitive |     on |     off |      281.982 |      423.632 |   472.552 |  1.502 | 1.676 |                 428.972 |   1.52× |
|  array-1000 | array-reverse-primitive |     on |      on |      453.413 |      561.684 |   653.606 |  1.239 | 1.442 |                 563.937 |   1.24× |
|  array-1000 |    array-reverse-nested |    off |     off |      474.471 |      859.205 |   702.335 |  1.811 | 1.480 |                 875.727 |   1.85× |
|  array-1000 |    array-reverse-nested |    off |      on |      662.943 |    26254.482 |   853.155 | 39.603 | 1.287 |               27930.895 |  42.13× |
|  array-1000 |    array-reverse-nested |     on |     off |      499.187 |      880.879 |   777.509 |  1.765 | 1.558 |                 901.764 |   1.81× |
|  array-1000 |    array-reverse-nested |     on |      on |      690.655 |    26952.960 |   923.187 | 39.025 | 1.337 |               28614.099 |  41.43× |
| array-10000 |              read-index |    off |     off |     5192.678 |     7968.344 |  9880.680 |  1.535 | 1.903 |                8209.532 |   1.58× |
| array-10000 |              read-index |    off |      on |     5232.228 |     7990.501 |  9915.235 |  1.527 | 1.895 |                8097.345 |   1.55× |
| array-10000 |              read-index |     on |     off |     5298.850 |     8027.468 | 10112.091 |  1.515 | 1.908 |                8088.567 |   1.53× |
| array-10000 |              read-index |     on |      on |     5270.916 |     8013.113 | 10156.617 |  1.520 | 1.927 |                8141.533 |   1.54× |
| array-10000 | mutation-density-100pct |    off |     off |     7146.312 |    13328.071 | 11397.937 |  1.865 | 1.595 |               13912.185 |   1.95× |
| array-10000 | mutation-density-100pct |    off |      on |    11488.806 |    20837.400 | 21486.071 |  1.814 | 1.870 |               21638.468 |   1.88× |
| array-10000 | mutation-density-100pct |     on |     off |     9223.748 |    15662.101 | 14878.733 |  1.698 | 1.613 |               16375.764 |   1.78× |
| array-10000 | mutation-density-100pct |     on |      on |    13841.427 |    22746.402 | 24087.464 |  1.643 | 1.740 |               24160.382 |   1.75× |
| array-10000 | array-reverse-primitive |    off |     off |     2888.809 |     4292.766 |  4329.548 |  1.486 | 1.499 |                4335.936 |   1.50× |
| array-10000 | array-reverse-primitive |    off |      on |     4558.873 |     5596.097 |  6078.098 |  1.228 | 1.333 |                5960.237 |   1.31× |
| array-10000 | array-reverse-primitive |     on |     off |     2996.585 |     4395.529 |  4875.065 |  1.467 | 1.627 |                4449.527 |   1.48× |
| array-10000 | array-reverse-primitive |     on |      on |     4704.111 |     5748.082 |  6653.166 |  1.222 | 1.414 |                6237.291 |   1.33× |
| array-10000 |    array-reverse-nested |    off |     off |     5668.571 |    10377.246 |  8326.519 |  1.831 | 1.469 |               10033.327 |   1.77× |
| array-10000 |    array-reverse-nested |    off |      on |     7736.579 |   284332.413 |  9940.651 | 36.752 | 1.285 |              281061.934 |  36.33× |
| array-10000 |    array-reverse-nested |     on |     off |     5847.269 |    10776.705 |  9062.466 |  1.843 | 1.550 |               10358.848 |   1.77× |
| array-10000 |    array-reverse-nested |     on |      on |     7828.177 |   290050.854 | 10739.398 | 37.052 | 1.372 |              288795.323 |  36.89× |

## Selected memory comparisons

Allocated bytes are V8 sampling estimates including harness overhead and collected temporary objects. Retained-output heap compares post-GC live-output and released-output snapshots, cancelling persistent runtime-cache growth; small or negative values are noise. The 2026-09-30 columns are the archived candidate measurements of the unoptimized source.

|            Dataset |                Scenario | Freeze | Patches | Candidate KiB/iter | v1 KiB/iter | Immer KiB/iter | 2026-09-30 candidate KiB/iter | Candidate retained KiB | v1 retained KiB | Immer retained KiB | 2026-09-30 retained KiB |
| -----------------: | ----------------------: | -----: | ------: | -----------------: | ----------: | -------------: | ----------------------------: | ---------------------: | --------------: | -----------------: | ----------------------: |
|     memory-default |              read-index |    off |     off |             95.965 |     153.009 |        194.123 |                       150.632 |                 -0.001 |           0.606 |             -0.002 |                   0.606 |
|     memory-default |              read-index |    off |      on |             96.460 |     149.697 |        194.958 |                       150.725 |                  0.132 |           0.746 |              0.134 |                   0.739 |
|     memory-default |              read-index |     on |     off |             96.686 |     151.875 |        194.349 |                       153.950 |                 -0.001 |           0.612 |             -0.002 |                   0.606 |
|     memory-default |              read-index |     on |      on |             98.268 |     151.268 |        195.136 |                       150.665 |                  0.132 |           0.739 |              0.134 |                   0.739 |
|     memory-default |              noop-empty |    off |     off |              3.327 |       3.500 |          2.990 |                         3.721 |                 -0.002 |          -0.002 |             -0.002 |                  -0.002 |
|     memory-default |              noop-empty |    off |      on |              3.612 |       4.286 |          3.483 |                         4.094 |                  0.131 |           0.131 |              0.131 |                   0.131 |
|     memory-default |              noop-empty |     on |     off |              3.432 |       3.701 |          2.832 |                         4.153 |                 -0.001 |          -0.001 |             -0.002 |                  -0.001 |
|     memory-default |              noop-empty |     on |      on |              3.216 |       3.865 |          3.624 |                         3.726 |                  0.131 |           0.131 |              0.131 |                   0.131 |
|     memory-default |     small-object-update |    off |     off |              4.500 |       5.707 |          4.032 |                         5.357 |                  0.076 |           0.089 |              0.006 |                   0.114 |
|     memory-default |     small-object-update |    off |      on |              5.478 |       6.123 |          5.790 |                         6.320 |                  0.633 |           0.637 |              0.662 |                   0.637 |
|     memory-default |     small-object-update |     on |     off |              4.631 |       6.002 |          4.208 |                         6.341 |                  0.047 |           0.130 |              0.076 |                   0.130 |
|     memory-default |     small-object-update |     on |      on |              6.447 |       6.592 |          6.288 |                         6.974 |                  0.600 |           0.654 |              0.662 |                   0.654 |
|     memory-default | mutation-density-100pct |    off |     off |            162.526 |     242.377 |        207.051 |                       243.501 |                  8.679 |          12.614 |              8.678 |                  12.614 |
|     memory-default | mutation-density-100pct |    off |      on |            229.584 |     321.211 |        292.221 |                       321.055 |                 28.218 |          31.369 |             28.217 |                  31.369 |
|     memory-default | mutation-density-100pct |     on |     off |            199.969 |     282.736 |        254.839 |                       287.208 |                  8.685 |          12.642 |              8.678 |                  12.643 |
|     memory-default | mutation-density-100pct |     on |      on |            272.781 |     360.413 |        336.719 |                       361.680 |                 28.223 |          31.394 |             27.603 |                  31.395 |
|     memory-default | array-reverse-primitive |    off |     off |             25.366 |      21.001 |         31.651 |                        20.967 |                  0.866 |           0.927 |              0.865 |                   0.920 |
|     memory-default | array-reverse-primitive |    off |      on |             58.436 |      51.134 |         59.805 |                        51.056 |                 18.842 |          18.896 |             18.842 |                  18.896 |
|     memory-default | array-reverse-primitive |     on |     off |             28.635 |      25.200 |         32.867 |                        25.206 |                  0.870 |           0.935 |              0.870 |                   0.932 |
|     memory-default | array-reverse-primitive |     on |      on |             62.870 |      54.753 |         61.302 |                        55.545 |                 18.846 |          18.909 |             18.846 |                  18.909 |
|     memory-default |    array-reverse-nested |    off |     off |             89.190 |     127.584 |        151.538 |                       127.382 |                  0.866 |           0.979 |              0.810 |                   0.979 |
|     memory-default |    array-reverse-nested |    off |      on |            122.042 |    2664.216 |        181.940 |                      2685.192 |                 18.842 |         100.351 |             18.589 |                 100.351 |
|     memory-default |    array-reverse-nested |     on |     off |             93.082 |     131.057 |        152.250 |                       130.646 |                  0.870 |           0.996 |              0.867 |                   0.989 |
|     memory-default |    array-reverse-nested |     on |      on |            128.852 |    2683.170 |        176.604 |                      2692.628 |                 18.847 |         100.353 |             18.845 |                 100.353 |
|  memory-array-1000 |              read-index |    off |     off |            993.655 |    1368.552 |       1603.236 |                      1377.313 |                  0.000 |           1.707 |             -0.003 |                   1.707 |
|  memory-array-1000 |              read-index |    off |      on |            988.104 |    1381.911 |       1592.562 |                      1377.093 |                  0.131 |           1.836 |              0.135 |                   1.840 |
|  memory-array-1000 |              read-index |     on |     off |            984.486 |    1378.885 |       1595.595 |                      1379.874 |                  0.000 |           1.707 |             -0.003 |                   1.707 |
|  memory-array-1000 |              read-index |     on |      on |            995.016 |    1378.767 |       1597.444 |                      1374.330 |                  0.131 |           1.840 |              0.135 |                   1.840 |
|  memory-array-1000 | mutation-density-100pct |    off |     off |           1512.655 |    2266.880 |       1820.099 |                      2145.743 |                 86.021 |         119.948 |             86.020 |                 119.939 |
|  memory-array-1000 | mutation-density-100pct |    off |      on |           2184.373 |    2982.721 |       2720.753 |                      2998.994 |                266.191 |         313.215 |            278.200 |                 313.199 |
|  memory-array-1000 | mutation-density-100pct |     on |     off |           1923.344 |    2617.043 |       2245.315 |                      2684.456 |                 86.032 |         120.049 |             86.031 |                 120.042 |
|  memory-array-1000 | mutation-density-100pct |     on |      on |           2595.554 |    3356.400 |       3157.535 |                      3384.831 |                265.562 |         313.273 |            278.210 |                 313.257 |
|  memory-array-1000 | array-reverse-primitive |    off |     off |            177.547 |     140.777 |        239.620 |                       141.210 |                  7.897 |           7.911 |              7.895 |                   7.911 |
|  memory-array-1000 | array-reverse-primitive |    off |      on |            498.255 |     405.783 |        486.765 |                       409.221 |                184.450 |         186.425 |            184.456 |                 186.440 |
|  memory-array-1000 | array-reverse-primitive |     on |     off |            218.713 |     181.171 |        241.754 |                       180.249 |                  7.904 |           9.982 |              9.978 |                   9.969 |
|  memory-array-1000 | array-reverse-primitive |     on |      on |            574.559 |     484.147 |        489.546 |                       481.328 |                184.457 |         186.297 |            184.536 |                 186.313 |
|  memory-array-1000 |    array-reverse-nested |    off |     off |            828.497 |    1231.097 |       1312.783 |                      1240.807 |                  7.898 |           6.295 |             12.000 |                   6.303 |
|  memory-array-1000 |    array-reverse-nested |    off |      on |           1177.465 |   26822.507 |       1566.906 |                     26741.213 |                184.451 |         996.429 |            184.450 |                 996.427 |
|  memory-array-1000 |    array-reverse-nested |     on |     off |            860.553 |    1288.019 |       1315.960 |                      1276.164 |                  7.902 |           6.858 |             11.962 |                   6.862 |
|  memory-array-1000 |    array-reverse-nested |     on |      on |           1218.816 |   26895.382 |       1551.165 |                     26958.863 |                184.458 |         996.465 |            184.457 |                 996.276 |
| memory-array-10000 |              read-index |    off |     off |           9516.404 |   13502.511 |      15753.923 |                     13565.461 |                 -0.004 |           3.405 |             -0.007 |                   3.414 |
| memory-array-10000 |              read-index |    off |      on |           9476.169 |   13529.864 |      15756.780 |                     13518.594 |                  0.130 |           3.560 |              0.138 |                   3.583 |
| memory-array-10000 |              read-index |     on |     off |           9535.498 |   13528.998 |      15741.930 |                     13564.317 |                 -0.004 |           3.414 |             -0.007 |                   3.405 |
| memory-array-10000 |              read-index |     on |      on |           9460.592 |   13475.214 |      15718.917 |                     13474.671 |                  0.130 |           3.711 |              0.138 |                   3.711 |
| memory-array-10000 | mutation-density-100pct |    off |     off |          14531.037 |   21975.006 |      16574.986 |                     21976.934 |                859.454 |        1178.031 |            859.454 |                1178.016 |
| memory-array-10000 | mutation-density-100pct |    off |      on |          21080.802 |   27828.517 |      25446.581 |                     27805.671 |               2734.906 |        3055.003 |           2734.899 |                3054.966 |
| memory-array-10000 | mutation-density-100pct |     on |     off |          18557.934 |   25559.034 |      20705.155 |                     26015.783 |                859.486 |        1178.155 |            859.476 |                1178.136 |
| memory-array-10000 | mutation-density-100pct |     on |      on |          25057.684 |   31302.029 |      29779.853 |                     31857.222 |               2734.932 |        3055.119 |           2734.925 |                3055.080 |
| memory-array-10000 | array-reverse-primitive |    off |     off |           1646.954 |    1212.198 |       2421.222 |                      1208.647 |                 78.211 |          82.390 |             78.204 |                  82.369 |
| memory-array-10000 | array-reverse-primitive |    off |      on |           4921.227 |    4083.744 |       4944.536 |                      3866.244 |               1797.399 |        1801.664 |           1797.399 |                1801.644 |
| memory-array-10000 | array-reverse-primitive |     on |     off |           2039.688 |    1603.413 |       2452.919 |                      1605.194 |                 78.229 |          82.298 |             78.219 |                  82.256 |
| memory-array-10000 | array-reverse-primitive |     on |      on |           5288.308 |    4240.615 |       4938.959 |                      4281.089 |               1796.463 |        1801.553 |           1797.414 |                1801.538 |
| memory-array-10000 |    array-reverse-nested |    off |     off |           8388.756 |   11105.993 |      12825.747 |                     11178.403 |                 78.204 |          85.888 |             78.204 |                  85.862 |
| memory-array-10000 |    array-reverse-nested |    off |      on |          11428.842 |  268458.541 |      14810.366 |                    268327.680 |               1797.407 |        9890.873 |           1797.399 |                9890.826 |
| memory-array-10000 |    array-reverse-nested |     on |     off |           8757.938 |   11459.487 |      12829.426 |                     11485.648 |                 78.219 |          85.812 |             78.219 |                  85.779 |
| memory-array-10000 |    array-reverse-nested |     on |      on |          11935.984 |  269569.944 |      14830.902 |                    269769.935 |               1797.424 |        9890.819 |           1797.418 |                9890.801 |

## CI budget gate (local run against main)

Status: **passed**. `node perf-testing/ci.mjs --base-dir <built main checkout>` compared this candidate with the merge base using the versioned policy: 8 latency scenarios × 5 paired repetitions and 2 memory scenarios × 3 repetitions, both freeze and patch modes. Paired median ratios (candidate / base):

| Metric / scenario / freeze / patches                 | Base median | Candidate median | Paired median ratio | Status |
| ---------------------------------------------------- | ----------: | ---------------: | ------------------: | ------ |
| latency/["read-index",false,false]                   |   770631.30 |        516623.90 |               0.667 | passed |
| latency/["read-index",false,true]                    |   773732.75 |        514943.74 |               0.666 | passed |
| latency/["read-index",true,false]                    |   777714.21 |        518453.34 |               0.669 | passed |
| latency/["read-index",true,true]                     |   778883.14 |        519769.51 |               0.669 | passed |
| latency/["small-object-update",false,false]          |     1091.58 |           647.14 |               0.592 | passed |
| latency/["small-object-update",false,true]           |     1448.71 |           966.02 |               0.669 | passed |
| latency/["small-object-update",true,false]           |     1246.97 |           802.08 |               0.642 | passed |
| latency/["small-object-update",true,true]            |     1606.32 |          1120.81 |               0.699 | passed |
| latency/["mutation-density-100pct",false,false]      |  1238858.75 |        639979.70 |               0.517 | passed |
| latency/["mutation-density-100pct",false,true]       |  1998106.62 |       1128349.01 |               0.569 | passed |
| latency/["mutation-density-100pct",true,false]       |  1403084.52 |        812776.06 |               0.579 | passed |
| latency/["mutation-density-100pct",true,true]        |  2179115.96 |       1300137.64 |               0.599 | passed |
| latency/["array-reverse-primitive",false,false]      |   414041.74 |        270861.47 |               0.653 | passed |
| latency/["array-reverse-primitive",false,true]       |   547330.49 |        441859.89 |               0.808 | passed |
| latency/["array-reverse-primitive",true,false]       |   423795.58 |        279982.29 |               0.660 | passed |
| latency/["array-reverse-primitive",true,true]        |   561497.88 |        455135.64 |               0.810 | passed |
| latency/["array-shift-nested",false,false]           |   832548.66 |        466217.98 |               0.558 | passed |
| latency/["array-shift-nested",false,true]            | 26133045.71 |        611740.23 |               0.023 | passed |
| latency/["array-shift-nested",true,false]            |   855638.50 |        491883.48 |               0.572 | passed |
| latency/["array-shift-nested",true,true]             | 26832250.05 |        633209.07 |               0.024 | passed |
| latency/["array-unshift-nested",false,false]         |   833602.16 |        469390.41 |               0.566 | passed |
| latency/["array-unshift-nested",false,true]          | 26352868.95 |        617017.04 |               0.024 | passed |
| latency/["array-unshift-nested",true,false]          |   856044.30 |        490140.66 |               0.570 | passed |
| latency/["array-unshift-nested",true,true]           | 27211537.55 |        640556.61 |               0.023 | passed |
| latency/["array-splice-insert-nested",false,false]   |   419029.34 |        237515.78 |               0.566 | passed |
| latency/["array-splice-insert-nested",false,true]    | 12836267.22 |        311522.41 |               0.024 | passed |
| latency/["array-splice-insert-nested",true,false]    |   437147.88 |        257715.60 |               0.590 | passed |
| latency/["array-splice-insert-nested",true,true]     | 13046237.28 |        333652.43 |               0.026 | passed |
| latency/["array-reverse-nested",false,false]         |   857685.11 |        472675.76 |               0.550 | passed |
| latency/["array-reverse-nested",false,true]          | 25922073.48 |        663627.66 |               0.026 | passed |
| latency/["array-reverse-nested",true,false]          |   880262.81 |        498231.57 |               0.568 | passed |
| latency/["array-reverse-nested",true,true]           | 27323179.10 |        692923.61 |               0.025 | passed |
| allocation/["mutation-density-100pct",false,false]   |  2317491.50 |       1553093.00 |               0.673 | passed |
| retainedHeap/["mutation-density-100pct",false,false] |   122817.50 |         88086.00 |               0.717 | passed |
| allocation/["mutation-density-100pct",false,true]    |  3057591.50 |       2254410.50 |               0.738 | passed |
| retainedHeap/["mutation-density-100pct",false,true]  |   320715.50 |        272579.50 |               0.850 | passed |
| allocation/["mutation-density-100pct",true,false]    |  2740791.00 |       1966081.50 |               0.719 | passed |
| retainedHeap/["mutation-density-100pct",true,false]  |   122940.50 |         88097.00 |               0.717 | passed |
| allocation/["mutation-density-100pct",true,true]     |  3461987.00 |       2649189.00 |               0.764 | passed |
| retainedHeap/["mutation-density-100pct",true,true]   |   320775.00 |        271934.00 |               0.848 | passed |
| allocation/["array-reverse-nested",false,false]      |  1275247.50 |        847384.50 |               0.661 | passed |
| retainedHeap/["array-reverse-nested",false,false]    |     6456.50 |          8088.00 |               1.252 | passed |
| allocation/["array-reverse-nested",false,true]       | 27445714.00 |       1210743.50 |               0.044 | passed |
| retainedHeap/["array-reverse-nested",false,true]     |  1020346.50 |        188878.00 |               0.185 | passed |
| allocation/["array-reverse-nested",true,false]       |  1298080.00 |        886038.00 |               0.673 | passed |
| retainedHeap/["array-reverse-nested",true,false]     |     7034.00 |          8092.00 |               1.150 | passed |
| allocation/["array-reverse-nested",true,true]        | 27520683.50 |       1251798.00 |               0.045 | passed |
| retainedHeap/["array-reverse-nested",true,true]      |  1020201.00 |        188884.00 |               0.185 | passed |

Latency values are ns per scenario; allocation and retained-heap values are bytes per scenario output. The complete gate report is archived next to this summary.

## Findings

- 338 of the 340 timing cells (67 scenarios × 4 modes at 100 rows, 9 scaling scenarios × 4 modes at 1,000 and 10,000 rows) are faster than Immer and two are within ±5%: `concat` with freeze on and patches off (19.777 versus 19.770 µs, candidate process range 15.531–20.248 µs) and `noop-empty` with freeze on and patches off (0.276 versus 0.289 µs); none is slower, and the geometric mean I/C is 1.68. Against the pinned npm 1.3.0 artifact, 334 cells are faster, five are within ±5% (`add` with freeze on and patches on, `update` with freeze on in both patch modes, `update-largeObject1` and `update-largeObject1-reuse` with freeze off), and one is slower: `concat` with freeze on and patches on (18.121 versus 17.139 µs, process ranges 16.377–20.855 versus 17.023–18.197 µs). Against the 2026-09-30 candidate measurement of the same source as v1, 337 cells are faster and three (`add`, `update`, and `concat` with freeze on and patches off) are within ±5%; none is slower, and all three ties are dominated by output freezing.
- Nested array movement with patches enabled, the strongest optimization target identified on 2026-09-30, improves by roughly 40x: at 1,000 rows with freeze off, `array-reverse-nested` drops from 27,930.895 µs to about 660 µs and is now faster than Immer; at 10,000 rows it drops from 281,061.934 µs to about 7,700 µs. The cause was eager parent patch generation that deep-cloned child drafts through their proxies; parents now generate patches after their children finalize, and patch values use the draft's original object when it was not modified or a `current()` snapshot when it was.
- Draft creation and reads improve uniformly: `read-index` is about 1.6x faster than before at 100 rows and 1.9–2.0x faster than Immer; `mutation-density-100pct` is 1.7–2.1x faster than before; `small-object-update` drops from 1.157 µs to about 0.64 µs and is now faster than Immer instead of 0.77x.
- `rtkq-sequence` with freeze off drops from 2,053.573 to 1,033.135 µs (I/C 1.14, previously 0.58). This required compiling to ES2018: with the ES2015 target, `{...o}` becomes `Object.assign({}, o)`, whose copies of dictionary-mode objects stay in dictionary mode and made the same workload bimodal (about 520 versus 5,500 µs depending on process order) in an earlier run.
- Review fixes measured here: compared with the first measurement of this branch, arrays are copied with `concat` only (no element reads or array methods before the copy), `current()` snapshots plain Sets that contain drafts, wide copies keep own `__proto__` keys as data properties, and the get trap keeps a per-draft registry of the child drafts it created (the first child inline, further children in an array or Map) so that own children, primitives, and non-draftable objects are returned without reading the original object (an accessor on the original is invoked no more often than on `main` for any value type). The registry is the one fix with a measurable cost: against the previous measurement of this branch, which compared every object value with the original instead, the geometric mean over all 340 timing cells is 3.0% slower (2.5% at 100 rows, 2.4% at 1,000 rows, 7.8% at 10,000 rows), 80 cells are more than 5% slower, and the read scenarios cost 1–14% more (`read-index` at 100 rows 47.6 → 49.1 µs, `read-missing` 16.1 → 18.0 µs). Scenarios that draft a single child per parent are unaffected because the first child is kept inline without allocating a container (`small-array-1-update` 0.860 → 0.880 µs). Frozen arrays no longer have a copy fast path, which costs up to about 30 µs per 10,000-element frozen array and shows in freeze-on cells with large arrays. All comparisons above already include those fixes.
- Memory: sampled allocation per iteration is lower than pinned v1 in 44 of the 56 memory cells (geometric mean C/v1 0.65 at 100 rows, 0.58 at 1,000 rows, 0.59 at 10,000 rows), with nested reverse under patches falling from about 2.6 MiB to 0.12 MiB per iteration at 100 rows. The child registry raises transient allocation in read-heavy cells by 6–11% against the previous measurement of this branch (`read-index` at 100 rows 87.7 → 96.0 KiB per iteration, versus 153.0 KiB for v1); retained-output heap is unchanged and lower than or equal to v1 in every cell except `array-reverse-nested` with patches off at 1,000 rows, where it is 7.90 KiB versus 6.29–6.86 KiB per output (inside the 1.35x / 1 KiB budget). The four `array-reverse-primitive` cells of each dataset allocate 13–36% more than v1 while retaining the same heap and running faster; the mechanism was not established.
- Wide-object insertion remains process-order sensitive: `update-largeObject1` with freeze off measures 53.5–56.5 µs when Mutative runs first and 97.5–102.1 µs after Immer, versus 53.8–54.3 and 221.1–224.3 µs for pinned v1 and 199.8–208.6 µs for Immer. Both orders beat Immer, but the pooled median hides the two modes; the fixture object is already in dictionary mode when Mutative runs first and in fast mode after Immer's spread created the same map transitions.

## CI budgets

The versioned policy passed locally against a built `main` checkout: all 48 decisions passed, patch operation counts matched, paired latency ratios span 0.023–0.810, allocation 0.044–0.764, and retained output 0.185–1.252. [Local base/head report](./2026-10-01-m1-max-node24-expanded-budgets-local.md) / [JSON](./2026-10-01-m1-max-node24-expanded-budgets-local.json). The GitHub run of the same gate belongs to the pull request checks.

## Reproduce

The measurements were taken on the tree of this archive's parent commit, whose `src/` matches the last code commit of the branch; the JSON build metadata records the source and artifact hashes. Install the frozen lockfile, build once, then run these commands sequentially. See [the benchmark guide](../README.md) for all options.

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm benchmark:immer:build
node perf-testing/ci.mjs --base-dir /absolute/path/to/built-main-checkout --output perf-testing/results/ci
node perf-testing/run-benchmarks.mjs --runs 3 --patches both --output perf-testing/results/expanded-default.json
node perf-testing/run-benchmarks.mjs --runs 3 --patches both --array-size 1000 --filter '^(read-index|read-forEach|read-missing|mutation-density-100pct|array-shift-nested|array-unshift-nested|array-splice-insert-nested|array-reverse-nested|array-reverse-primitive)$' --output perf-testing/results/expanded-array-1000.json
node perf-testing/run-benchmarks.mjs --runs 3 --patches both --array-size 10000 --filter '^(read-index|read-forEach|read-missing|mutation-density-100pct|array-shift-nested|array-unshift-nested|array-splice-insert-nested|array-reverse-nested|array-reverse-primitive)$' --output perf-testing/results/expanded-array-10000.json
node perf-testing/run-benchmarks.mjs --runs 6 --freeze off --filter '^update-largeObject1$' --output perf-testing/results/object-order.json
node perf-testing/run-memory.mjs --runs 3 --patches both --memory-iterations 32 --filter '^(small-object-update|noop-empty|read-index|mutation-density-100pct|array-reverse-primitive|array-reverse-nested)$' --output perf-testing/results/expanded-memory-default.json
node perf-testing/run-memory.mjs --runs 3 --patches both --array-size 1000 --memory-iterations 16 --filter '^(read-index|mutation-density-100pct|array-reverse-primitive|array-reverse-nested)$' --output perf-testing/results/expanded-memory-array-1000.json
node perf-testing/run-memory.mjs --runs 3 --patches both --array-size 10000 --memory-iterations 8 --filter '^(read-index|mutation-density-100pct|array-reverse-primitive|array-reverse-nested)$' --output perf-testing/results/expanded-memory-array-10000.json
```

The [object-order control](./2026-10-01-m1-max-node24-object-order.md) / [JSON](./2026-10-01-m1-max-node24-object-order.json) records the six alternating processes. Cold or incoming-data freezing, patch application and serialization, Map/Set, sparse arrays, deeper object paths, and browser engines remain unmeasured, as before.
