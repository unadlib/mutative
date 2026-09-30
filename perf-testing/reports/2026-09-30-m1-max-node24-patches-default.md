# Mutative vs Immer workload benchmarks

Recorded: 2026-09-30T11:21:02.142Z. 3 independent Node processes; median of each process's mean time.

Local Mutative **1.3.0** at `3e206b05b7e131482a3febc766bab03b683a4049`; installed Immer **11.1.18**; Mitata **1.0.34**.

Environment: Apple M1 Max, 64 GiB RAM, darwin/arm64, Node v24.16.0, V8 13.6.233.17-node.49.

Fixture: array 100, 10 nested items/row, objects with 1000/3000 properties; reuse 10 calls; RTKQ 100 pending + 100 resolved calls.

Both libraries use production artifacts. Array-method plugins are disabled. Freeze off uses unfrozen inputs; freeze on uses pre-frozen inputs and payloads. Construction, configuration, and correctness checks are outside timing. Each iteration resets to its immutable base and evolves it only within that scenario.

Enabled patch trials generate forward and inverse operations at every reducer call. Both libraries use array paths and index-based array removals (Mutative: arrayLengthAssignment false). Every producer tuple escapes; patch application, serialization, and accumulation are excluded from timing. Operation counts sum across all calls in the scenario.

Times are **microseconds per full scenario**, including natural GC. Ratio = Immer time / Mutative time; above 1 favors Mutative, below 1 favors Immer. These are scenario measurements, not a universal speedup. P99 describes Mitata samples, which can be batches of operations; it is not per-request tail latency.

## Auto-freeze off (unfrozen input); patches off

| Scenario                  | Calls | Mutative µs | Immer µs |  I/M | Mutative sample p99 µs | Immer sample p99 µs |
| ------------------------- | ----: | ----------: | -------: | ---: | ---------------------: | ------------------: |
| add                       |     1 |       2.217 |    1.929 | 0.87 |                  2.395 |               2.048 |
| remove                    |     1 |      87.595 |   72.476 | 0.83 |                117.167 |             101.083 |
| filter                    |     1 |      46.431 |   32.687 | 0.70 |                 46.535 |              32.811 |
| update                    |     1 |       2.574 |    1.909 | 0.74 |                  2.681 |               2.010 |
| concat                    |     1 |       1.052 |    0.915 | 0.87 |                  1.135 |               0.986 |
| mapNested                 |     1 |      99.327 |   72.494 | 0.73 |                135.458 |              95.416 |
| update-largeObject1       |     1 |      61.611 |  204.528 | 3.32 |                113.417 |             473.041 |
| update-largeObject2       |     1 |     526.248 |  572.262 | 1.09 |               1076.584 |             706.792 |
| update-high               |     1 |      33.815 |   26.025 | 0.77 |                 34.133 |              34.834 |
| update-multiple           |     1 |      11.919 |   10.113 | 0.85 |                 12.028 |              10.155 |
| remove-high               |     1 |      50.791 |   45.553 | 0.90 |                 67.209 |              60.917 |
| sortById-reverse          |     1 |     102.784 |   72.871 | 0.71 |                162.709 |             126.208 |
| reverse-array             |     1 |      89.231 |   71.863 | 0.81 |                136.791 |             143.875 |
| update-reuse              |    10 |      44.024 |   32.986 | 0.75 |                 44.158 |              33.076 |
| update-high-reuse         |    10 |     348.737 |  256.154 | 0.73 |                478.042 |             365.666 |
| remove-reuse              |    10 |     796.803 |  659.527 | 0.83 |                975.666 |             854.959 |
| remove-high-reuse         |    10 |     475.263 |  420.211 | 0.88 |                670.000 |             610.625 |
| update-largeObject1-reuse |    10 |    2230.873 | 1392.758 | 0.62 |               2665.334 |            1704.750 |
| update-largeObject2-reuse |    10 |    5456.823 | 6184.089 | 1.13 |               6117.541 |            8078.792 |
| mixed-sequence            |     5 |      97.768 |   77.695 | 0.79 |                145.541 |             122.792 |
| rtkq-sequence             |   200 |    2018.137 | 1179.315 | 0.58 |               2304.250 |            1402.125 |

Independent-process mean ranges (µs):

| Scenario                  |  Mutative min–max |     Immer min–max |
| ------------------------- | ----------------: | ----------------: |
| add                       |       2.215–2.255 |       1.918–1.959 |
| remove                    |     87.436–88.790 |     72.295–72.705 |
| filter                    |     45.966–46.551 |     32.505–32.917 |
| update                    |       2.571–2.605 |       1.900–1.961 |
| concat                    |       1.043–1.055 |       0.909–0.916 |
| mapNested                 |    99.193–100.261 |     70.727–73.128 |
| update-largeObject1       |    57.793–238.551 |   159.767–204.532 |
| update-largeObject2       |   522.068–526.251 |   571.931–577.614 |
| update-high               |     32.794–34.032 |     24.360–26.720 |
| update-multiple           |     11.893–11.950 |     10.032–10.395 |
| remove-high               |     49.883–51.354 |     45.299–46.223 |
| sortById-reverse          |   100.391–103.135 |     72.792–73.525 |
| reverse-array             |     88.555–92.088 |     71.331–72.021 |
| update-reuse              |     43.509–44.074 |     32.518–33.548 |
| update-high-reuse         |   348.583–350.096 |   252.718–257.747 |
| remove-reuse              |   788.576–798.359 |   656.595–667.170 |
| remove-high-reuse         |   466.123–479.978 |   420.080–424.842 |
| update-largeObject1-reuse | 2204.282–2262.496 | 1387.618–1429.590 |
| update-largeObject2-reuse | 5405.409–5489.128 | 6130.691–6195.265 |
| mixed-sequence            |     96.931–97.862 |     77.298–79.129 |
| rtkq-sequence             | 1993.827–2048.892 | 1170.470–1322.233 |

## Auto-freeze off (unfrozen input); patches on

| Scenario                  | Calls | Mutative µs | Immer µs |  I/M | Mutative sample p99 µs | Immer sample p99 µs |
| ------------------------- | ----: | ----------: | -------: | ---: | ---------------------: | ------------------: |
| add                       |     1 |       3.888 |    5.073 | 1.30 |                  3.990 |               5.179 |
| remove                    |     1 |    3046.490 |   86.085 | 0.03 |               3452.000 |             123.542 |
| filter                    |     1 |      47.092 |   33.089 | 0.70 |                 77.500 |              33.299 |
| update                    |     1 |       3.751 |    3.503 | 0.93 |                  3.838 |               3.635 |
| concat                    |     1 |       1.262 |    1.209 | 0.96 |                  1.352 |               1.323 |
| mapNested                 |     1 |     100.069 |   73.752 | 0.74 |                133.250 |             100.042 |
| update-largeObject1       |     1 |     236.043 |  159.080 | 0.67 |                414.625 |             371.709 |
| update-largeObject2       |     1 |     522.349 |  576.612 | 1.10 |               1079.791 |             705.708 |
| update-high               |     1 |      34.761 |   26.432 | 0.76 |                 34.961 |              27.769 |
| update-multiple           |     1 |      17.028 |   18.402 | 1.08 |                 17.152 |              18.072 |
| remove-high               |     1 |     619.744 |   51.950 | 0.08 |                772.250 |              82.833 |
| sortById-reverse          |     1 |    3119.311 |   87.524 | 0.03 |               3457.000 |             166.042 |
| reverse-array             |     1 |    3149.267 |   85.056 | 0.03 |               3531.458 |             119.083 |
| update-reuse              |    10 |      55.646 |   49.914 | 0.90 |                 95.916 |              76.083 |
| update-high-reuse         |    10 |     358.881 |  277.610 | 0.77 |                510.750 |             446.833 |
| remove-reuse              |    10 |   27784.899 |  789.729 | 0.03 |              28189.917 |            1118.250 |
| remove-high-reuse         |    10 |    4785.654 |  486.668 | 0.10 |               5181.125 |             715.500 |
| update-largeObject1-reuse |    10 |    2234.841 | 1426.898 | 0.64 |               2615.625 |            1739.583 |
| update-largeObject2-reuse |    10 |    5436.931 | 6219.848 | 1.14 |               6194.875 |            8021.208 |
| mixed-sequence            |     5 |     145.052 |   95.887 | 0.66 |                216.375 |             142.083 |
| rtkq-sequence             |   200 |    2136.247 | 1551.253 | 0.73 |               2440.958 |            1986.250 |

Patch operations per full scenario:

| Scenario                  | Mutative forward / inverse | Immer forward / inverse |
| ------------------------- | -------------------------: | ----------------------: |
| add                       |                      1 / 1 |                   1 / 1 |
| remove                    |                  100 / 100 |               100 / 100 |
| filter                    |                      1 / 1 |                   1 / 1 |
| update                    |                      2 / 2 |                   2 / 2 |
| concat                    |                      1 / 1 |                   1 / 1 |
| mapNested                 |                      1 / 1 |                   1 / 1 |
| update-largeObject1       |                      1 / 1 |                   1 / 1 |
| update-largeObject2       |                      1 / 1 |                   1 / 1 |
| update-high               |                      2 / 2 |                   2 / 2 |
| update-multiple           |                    10 / 10 |                 10 / 10 |
| remove-high               |                    20 / 20 |                 20 / 20 |
| sortById-reverse          |                  100 / 100 |               100 / 100 |
| reverse-array             |                  100 / 100 |               100 / 100 |
| update-reuse              |                    20 / 20 |                 20 / 20 |
| update-high-reuse         |                    20 / 20 |                 20 / 20 |
| remove-reuse              |                  910 / 910 |               910 / 910 |
| remove-high-reuse         |                  155 / 155 |               155 / 155 |
| update-largeObject1-reuse |                    10 / 10 |                 10 / 10 |
| update-largeObject2-reuse |                    10 / 10 |                 10 / 10 |
| mixed-sequence            |                    18 / 18 |                 18 / 18 |
| rtkq-sequence             |                  500 / 500 |               500 / 500 |

Independent-process mean ranges (µs):

| Scenario                  |    Mutative min–max |     Immer min–max |
| ------------------------- | ------------------: | ----------------: |
| add                       |         3.852–3.947 |       4.958–5.180 |
| remove                    |   3044.584–3092.927 |     85.937–86.688 |
| filter                    |       46.955–47.238 |     32.934–33.285 |
| update                    |         3.749–3.766 |       3.482–3.588 |
| concat                    |         1.244–1.267 |       1.202–1.243 |
| mapNested                 |      99.780–100.900 |     71.414–73.949 |
| update-largeObject1       |     230.850–236.582 |   158.500–159.784 |
| update-largeObject2       |     522.089–530.948 |   574.819–578.475 |
| update-high               |       34.080–35.198 |     26.108–27.660 |
| update-multiple           |       17.001–17.072 |     18.098–19.064 |
| remove-high               |     600.522–671.920 |     51.886–52.435 |
| sortById-reverse          |   3043.884–3217.699 |     86.658–87.680 |
| reverse-array             |   3041.307–3194.449 |     83.831–85.574 |
| update-reuse              |       55.528–56.246 |     49.323–50.744 |
| update-high-reuse         |     358.747–361.937 |   273.264–277.626 |
| remove-reuse              | 26657.203–28498.213 |   789.572–791.414 |
| remove-high-reuse         |   4726.208–5008.025 |   474.792–508.823 |
| update-largeObject1-reuse |   2203.937–2287.726 | 1411.605–1443.315 |
| update-largeObject2-reuse |   5390.428–5502.227 | 6125.845–6220.041 |
| mixed-sequence            |     144.930–146.704 |     95.727–98.234 |
| rtkq-sequence             |   2115.712–2361.777 | 1548.809–1714.789 |

## Auto-freeze on (pre-frozen input); patches off

| Scenario                  | Calls | Mutative µs | Immer µs |  I/M | Mutative sample p99 µs | Immer sample p99 µs |
| ------------------------- | ----: | ----------: | -------: | ---: | ---------------------: | ------------------: |
| add                       |     1 |      19.362 |   25.483 | 1.32 |                 22.321 |              28.914 |
| remove                    |     1 |     110.730 |   97.617 | 0.88 |                153.750 |             135.625 |
| filter                    |     1 |      64.354 |   54.902 | 0.85 |                 92.583 |              77.959 |
| update                    |     1 |      21.437 |   24.850 | 1.16 |                 23.847 |              27.567 |
| concat                    |     1 |      20.917 |   21.828 | 1.04 |                 22.564 |              23.617 |
| mapNested                 |     1 |     120.802 |   95.909 | 0.79 |                224.125 |             143.458 |
| update-largeObject1       |     1 |     358.669 |  245.213 | 0.68 |                558.125 |             442.375 |
| update-largeObject2       |     1 |     814.386 |  873.087 | 1.07 |               1376.792 |            1035.750 |
| update-high               |     1 |      47.464 |   44.367 | 0.93 |                 71.333 |              46.244 |
| update-multiple           |     1 |      26.333 |   29.365 | 1.12 |                 28.750 |              30.564 |
| remove-high               |     1 |      66.941 |   64.347 | 0.96 |                118.042 |             112.083 |
| sortById-reverse          |     1 |     115.259 |   91.266 | 0.79 |                182.083 |             169.166 |
| reverse-array             |     1 |     103.512 |   89.985 | 0.87 |                145.833 |             177.833 |
| update-reuse              |    10 |     176.718 |  208.727 | 1.18 |                278.833 |             312.125 |
| update-high-reuse         |    10 |     475.191 |  448.820 | 0.94 |                658.000 |             641.208 |
| remove-reuse              |    10 |     929.325 |  833.473 | 0.90 |               1230.041 |            1059.250 |
| remove-high-reuse         |    10 |     601.840 |  612.018 | 1.02 |                807.375 |             827.875 |
| update-largeObject1-reuse |    10 |    3334.092 | 2786.750 | 0.84 |               3789.834 |            3187.250 |
| update-largeObject2-reuse |    10 |    8509.204 | 9253.452 | 1.09 |               9235.292 |            9707.958 |
| mixed-sequence            |     5 |     160.547 |  170.328 | 1.06 |                252.834 |             261.750 |
| rtkq-sequence             |   200 |    5269.386 | 4725.558 | 0.90 |               6478.833 |            5669.666 |

Independent-process mean ranges (µs):

| Scenario                  |  Mutative min–max |     Immer min–max |
| ------------------------- | ----------------: | ----------------: |
| add                       |     18.376–20.694 |     25.103–25.705 |
| remove                    |   108.467–110.861 |     96.296–98.927 |
| filter                    |     63.177–67.037 |     53.388–55.225 |
| update                    |     21.241–22.481 |     23.761–26.522 |
| concat                    |     19.653–21.442 |     21.711–22.432 |
| mapNested                 |   120.018–121.840 |     95.224–96.361 |
| update-largeObject1       |   353.171–358.864 |   243.790–245.879 |
| update-largeObject2       |   802.681–834.361 |   865.835–907.959 |
| update-high               |     47.266–48.247 |     42.474–44.832 |
| update-multiple           |     25.433–26.839 |     28.524–30.162 |
| remove-high               |     65.317–69.528 |     64.188–65.495 |
| sortById-reverse          |   112.904–116.715 |     91.027–97.296 |
| reverse-array             |   102.882–104.250 |     88.630–90.051 |
| update-reuse              |   162.723–177.403 |   208.067–215.404 |
| update-high-reuse         |   469.794–498.076 |   442.963–449.530 |
| remove-reuse              |   923.634–931.526 |   822.995–840.684 |
| remove-high-reuse         |   595.208–602.863 |   598.729–614.897 |
| update-largeObject1-reuse | 3331.054–3434.084 | 2746.307–2813.203 |
| update-largeObject2-reuse | 8416.123–8572.393 | 9236.940–9255.019 |
| mixed-sequence            |   157.258–161.931 |   164.404–171.795 |
| rtkq-sequence             | 5198.413–5365.959 | 4630.124–4899.964 |

## Auto-freeze on (pre-frozen input); patches on

| Scenario                  | Calls | Mutative µs | Immer µs |  I/M | Mutative sample p99 µs | Immer sample p99 µs |
| ------------------------- | ----: | ----------: | -------: | ---: | ---------------------: | ------------------: |
| add                       |     1 |      22.237 |   27.927 | 1.26 |                 27.769 |              30.815 |
| remove                    |     1 |    3090.203 |  112.294 | 0.04 |               3565.917 |             197.042 |
| filter                    |     1 |      65.440 |   55.264 | 0.84 |                120.667 |              90.458 |
| update                    |     1 |      23.101 |   27.393 | 1.19 |                 25.835 |              30.918 |
| concat                    |     1 |      19.156 |   23.051 | 1.20 |                 22.482 |              26.004 |
| mapNested                 |     1 |     120.840 |   97.774 | 0.81 |                182.167 |             189.333 |
| update-largeObject1       |     1 |     358.217 |  273.633 | 0.76 |                562.541 |             637.042 |
| update-largeObject2       |     1 |     818.540 |  877.377 | 1.07 |               1391.334 |            1048.875 |
| update-high               |     1 |      48.265 |   45.402 | 0.94 |                 50.473 |              78.833 |
| update-multiple           |     1 |      31.635 |   38.235 | 1.21 |                 33.567 |              39.797 |
| remove-high               |     1 |     652.892 |   70.601 | 0.11 |                816.834 |             125.000 |
| sortById-reverse          |     1 |    3217.365 |  105.430 | 0.03 |               3588.792 |             151.583 |
| reverse-array             |     1 |    3167.932 |  105.071 | 0.03 |               3661.708 |             153.583 |
| update-reuse              |    10 |     191.856 |  233.438 | 1.22 |                305.292 |             360.041 |
| update-high-reuse         |    10 |     506.940 |  468.977 | 0.93 |                700.792 |             637.625 |
| remove-reuse              |    10 |   28054.950 |  983.854 | 0.04 |              28413.125 |            1460.416 |
| remove-high-reuse         |    10 |    5008.593 |  655.411 | 0.13 |               5530.208 |             940.291 |
| update-largeObject1-reuse |    10 |    3312.887 | 2757.856 | 0.83 |               3744.458 |            3115.458 |
| update-largeObject2-reuse |    10 |    8473.516 | 9232.102 | 1.09 |               9152.375 |            9636.500 |
| mixed-sequence            |     5 |     213.952 |  187.853 | 0.88 |                337.750 |             307.541 |
| rtkq-sequence             |   200 |    5566.332 | 5143.060 | 0.92 |               6837.542 |            6210.834 |

Patch operations per full scenario:

| Scenario                  | Mutative forward / inverse | Immer forward / inverse |
| ------------------------- | -------------------------: | ----------------------: |
| add                       |                      1 / 1 |                   1 / 1 |
| remove                    |                  100 / 100 |               100 / 100 |
| filter                    |                      1 / 1 |                   1 / 1 |
| update                    |                      2 / 2 |                   2 / 2 |
| concat                    |                      1 / 1 |                   1 / 1 |
| mapNested                 |                      1 / 1 |                   1 / 1 |
| update-largeObject1       |                      1 / 1 |                   1 / 1 |
| update-largeObject2       |                      1 / 1 |                   1 / 1 |
| update-high               |                      2 / 2 |                   2 / 2 |
| update-multiple           |                    10 / 10 |                 10 / 10 |
| remove-high               |                    20 / 20 |                 20 / 20 |
| sortById-reverse          |                  100 / 100 |               100 / 100 |
| reverse-array             |                  100 / 100 |               100 / 100 |
| update-reuse              |                    20 / 20 |                 20 / 20 |
| update-high-reuse         |                    20 / 20 |                 20 / 20 |
| remove-reuse              |                  910 / 910 |               910 / 910 |
| remove-high-reuse         |                  155 / 155 |               155 / 155 |
| update-largeObject1-reuse |                    10 / 10 |                 10 / 10 |
| update-largeObject2-reuse |                    10 / 10 |                 10 / 10 |
| mixed-sequence            |                    18 / 18 |                 18 / 18 |
| rtkq-sequence             |                  500 / 500 |               500 / 500 |

Independent-process mean ranges (µs):

| Scenario                  |    Mutative min–max |     Immer min–max |
| ------------------------- | ------------------: | ----------------: |
| add                       |       20.671–23.478 |     27.100–28.469 |
| remove                    |   3043.617–3218.074 |   112.055–112.885 |
| filter                    |       65.043–68.394 |     55.046–55.546 |
| update                    |       21.385–23.417 |     26.640–28.449 |
| concat                    |       18.662–21.543 |     22.676–23.474 |
| mapNested                 |     118.405–120.887 |     95.486–98.562 |
| update-largeObject1       |     350.512–365.485 |   246.189–310.923 |
| update-largeObject2       |     807.533–836.008 |   863.807–912.926 |
| update-high               |       48.051–49.749 |     45.364–49.721 |
| update-multiple           |       30.691–31.857 |     37.049–38.499 |
| remove-high               |     627.905–671.872 |     70.308–71.170 |
| sortById-reverse          |   3096.737–3342.983 |   104.573–106.788 |
| reverse-array             |   2986.436–3241.490 |   104.444–105.743 |
| update-reuse              |     190.317–194.500 |   229.161–235.076 |
| update-high-reuse         |     490.403–509.944 |   447.516–477.400 |
| remove-reuse              | 26902.265–29160.149 |   966.661–987.326 |
| remove-high-reuse         |   4989.963–5253.536 |   653.925–676.859 |
| update-largeObject1-reuse |   3298.648–3425.195 | 2753.470–2808.878 |
| update-largeObject2-reuse |   8463.523–8514.433 | 9193.646–9245.399 |
| mixed-sequence            |     205.794–214.726 |   184.871–198.718 |
| rtkq-sequence             |   5536.796–5862.598 | 5137.923–5358.269 |

The accompanying JSON retains every process result, sample count, timing percentiles, measurement order, artifact SHA-256 hashes, configuration, and environment metadata.
