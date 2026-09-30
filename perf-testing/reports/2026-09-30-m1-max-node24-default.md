# Mutative vs Immer workload benchmarks

Recorded: 2026-09-30T08:31:43.801Z. 3 independent Node processes; median of each process's mean time.

Local Mutative **1.3.0** at `071eedef2bb7663143493783bc18857cb5a77a09`; installed Immer **11.1.18**; Mitata **1.0.34**.

Environment: Apple M1 Max, 64 GiB RAM, darwin/arm64, Node v24.16.0, V8 13.6.233.17-node.49.

Fixture: array 100, 10 nested items/row, objects with 1000/3000 properties; reuse 10 calls; RTKQ 100 pending + 100 resolved calls.

Both libraries use production artifacts. Array-method plugins and patches are disabled. Freeze off uses unfrozen inputs; freeze on uses pre-frozen inputs and payloads. Construction, configuration, and correctness checks are outside timing. Each iteration resets to its immutable base and evolves it only within that scenario.

Times are **microseconds per full scenario**, including natural GC. Ratio = Immer time / Mutative time; above 1 favors Mutative, below 1 favors Immer. These are scenario measurements, not a universal speedup. P99 describes Mitata samples, which can be batches of operations; it is not per-request tail latency.

## Auto-freeze off (unfrozen input)

| Scenario                  | Calls | Mutative µs | Immer µs |  I/M | Mutative sample p99 µs | Immer sample p99 µs |
| ------------------------- | ----: | ----------: | -------: | ---: | ---------------------: | ------------------: |
| add                       |     1 |       2.255 |    1.939 | 0.86 |                  2.460 |               2.198 |
| remove                    |     1 |      87.924 |   72.412 | 0.82 |                125.375 |             111.500 |
| filter                    |     1 |      47.190 |   33.265 | 0.70 |                 92.958 |              33.697 |
| update                    |     1 |       2.608 |    1.916 | 0.73 |                  2.750 |               2.000 |
| concat                    |     1 |       1.044 |    0.916 | 0.88 |                  1.148 |               0.990 |
| mapNested                 |     1 |     101.641 |   69.674 | 0.69 |                151.042 |              95.000 |
| update-largeObject1       |     1 |      58.830 |  210.257 | 3.57 |                125.958 |             494.750 |
| update-largeObject2       |     1 |     526.832 |  586.028 | 1.11 |               1119.875 |             713.750 |
| update-high               |     1 |      34.768 |   24.565 | 0.71 |                 34.970 |              36.042 |
| update-multiple           |     1 |      12.295 |   10.429 | 0.85 |                 12.347 |              10.540 |
| remove-high               |     1 |      54.909 |   46.965 | 0.86 |                 94.000 |              74.583 |
| sortById-reverse          |     1 |     104.420 |   75.249 | 0.72 |                154.333 |             111.250 |
| reverse-array             |     1 |      98.966 |   77.084 | 0.78 |                179.583 |             180.291 |
| update-reuse              |    10 |      45.640 |   34.867 | 0.76 |                 45.768 |              40.579 |
| update-high-reuse         |    10 |     370.990 |  283.111 | 0.76 |                509.291 |             466.083 |
| remove-reuse              |    10 |     810.223 |  694.150 | 0.86 |               1206.834 |             976.000 |
| remove-high-reuse         |    10 |     496.516 |  430.509 | 0.87 |                649.791 |             642.667 |
| update-largeObject1-reuse |    10 |    2327.382 | 1681.136 | 0.72 |               2773.917 |            3965.667 |
| update-largeObject2-reuse |    10 |    5616.916 | 6422.331 | 1.14 |               6403.833 |            8684.250 |
| mixed-sequence            |     5 |     104.764 |   77.091 | 0.74 |                167.750 |             135.083 |
| rtkq-sequence             |   200 |    2077.670 | 1322.882 | 0.64 |               2397.583 |            1601.583 |

Independent-process mean ranges (µs):

| Scenario                  |  Mutative min–max |     Immer min–max |
| ------------------------- | ----------------: | ----------------: |
| add                       |       2.253–2.282 |       1.921–2.000 |
| remove                    |     87.443–88.714 |     71.983–72.606 |
| filter                    |     46.675–47.753 |     33.014–39.775 |
| update                    |       2.605–2.672 |       1.898–1.935 |
| concat                    |       1.042–1.068 |       0.916–0.922 |
| mapNested                 |    98.416–102.505 |     64.883–70.559 |
| update-largeObject1       |    58.424–238.028 |   160.857–210.482 |
| update-largeObject2       |   525.254–528.344 |   583.276–586.476 |
| update-high               |     34.719–35.699 |     24.354–27.042 |
| update-multiple           |     11.831–12.330 |      9.999–10.768 |
| remove-high               |     50.170–56.525 |     45.741–48.104 |
| sortById-reverse          |    99.731–104.552 |     74.832–76.881 |
| reverse-array             |    88.057–107.367 |     74.888–90.979 |
| update-reuse              |     43.552–49.320 |     32.915–37.562 |
| update-high-reuse         |   345.562–423.127 |   265.334–299.583 |
| remove-reuse              |   796.560–947.277 |   660.561–926.658 |
| remove-high-reuse         |   463.666–676.862 |   420.607–606.778 |
| update-largeObject1-reuse | 2272.840–3437.462 | 1425.738–3473.599 |
| update-largeObject2-reuse | 5517.358–8779.490 | 6339.108–9991.267 |
| mixed-sequence            |    98.398–153.571 |    76.670–140.299 |
| rtkq-sequence             | 2004.447–3043.670 | 1194.565–1687.681 |

## Auto-freeze on (pre-frozen input)

| Scenario                  | Calls | Mutative µs | Immer µs |  I/M | Mutative sample p99 µs | Immer sample p99 µs |
| ------------------------- | ----: | ----------: | -------: | ---: | ---------------------: | ------------------: |
| add                       |     1 |      19.559 |   23.281 | 1.19 |                 22.077 |              25.012 |
| remove                    |     1 |     107.063 |   97.126 | 0.91 |                170.500 |             195.375 |
| filter                    |     1 |      70.729 |   55.036 | 0.78 |                119.542 |             112.500 |
| update                    |     1 |      20.324 |   25.353 | 1.25 |                 22.609 |              27.840 |
| concat                    |     1 |      18.885 |   21.915 | 1.16 |                 21.533 |              24.248 |
| mapNested                 |     1 |     122.762 |   95.056 | 0.77 |                193.708 |             144.333 |
| update-largeObject1       |     1 |     350.541 |  259.592 | 0.74 |                554.250 |             473.000 |
| update-largeObject2       |     1 |     836.671 |  925.697 | 1.11 |               1412.333 |            1075.375 |
| update-high               |     1 |      47.277 |   42.352 | 0.90 |                 71.417 |              62.416 |
| update-multiple           |     1 |      25.727 |   34.891 | 1.36 |                 27.263 |              45.758 |
| remove-high               |     1 |      69.188 |   67.778 | 0.98 |                117.833 |             125.125 |
| sortById-reverse          |     1 |     117.219 |   96.588 | 0.82 |                192.500 |             146.125 |
| reverse-array             |     1 |     113.178 |   95.410 | 0.84 |                187.833 |             177.667 |
| update-reuse              |    10 |     186.060 |  231.424 | 1.24 |                305.792 |             496.125 |
| update-high-reuse         |    10 |     639.394 |  475.419 | 0.74 |               1852.375 |             896.375 |
| remove-reuse              |    10 |     957.632 |  886.518 | 0.93 |               1556.167 |            1228.791 |
| remove-high-reuse         |    10 |     634.120 |  629.097 | 0.99 |                947.291 |             891.791 |
| update-largeObject1-reuse |    10 |    3497.756 | 2898.143 | 0.83 |               4223.500 |            3293.292 |
| update-largeObject2-reuse |    10 |    8960.603 | 9605.409 | 1.07 |               9739.000 |            9944.125 |
| mixed-sequence            |     5 |     170.656 |  172.661 | 1.01 |                296.917 |             281.125 |
| rtkq-sequence             |   200 |    5525.964 | 5934.062 | 1.07 |               6559.625 |           10967.666 |

Independent-process mean ranges (µs):

| Scenario                  |   Mutative min–max |      Immer min–max |
| ------------------------- | -----------------: | -----------------: |
| add                       |      18.396–19.886 |      22.513–25.083 |
| remove                    |    107.043–108.151 |     94.976–101.707 |
| filter                    |      64.875–70.954 |      54.075–55.822 |
| update                    |      19.923–20.985 |      24.097–26.285 |
| concat                    |      17.185–19.477 |      20.793–22.849 |
| mapNested                 |    118.681–123.931 |      88.270–95.889 |
| update-largeObject1       |    347.776–355.088 |    250.365–301.420 |
| update-largeObject2       |    805.392–838.979 |    881.684–955.944 |
| update-high               |      47.204–47.803 |      41.641–46.068 |
| update-multiple           |      25.684–28.712 |      32.103–35.070 |
| remove-high               |      62.380–70.069 |      66.681–67.946 |
| sortById-reverse          |    113.568–128.583 |     94.121–102.798 |
| reverse-array             |    102.661–121.439 |     92.624–101.064 |
| update-reuse              |    170.772–209.306 |    220.806–242.593 |
| update-high-reuse         |    483.508–700.365 |    471.587–593.734 |
| remove-reuse              |   933.598–1422.375 |   845.480–1262.930 |
| remove-high-reuse         |    619.490–914.138 |   605.170–1229.266 |
| update-largeObject1-reuse |  3336.431–4351.899 |  2880.388–4425.416 |
| update-largeObject2-reuse | 8747.872–12402.667 | 9504.716–14949.922 |
| mixed-sequence            |    163.118–255.859 |    169.546–217.213 |
| rtkq-sequence             |  5277.264–8303.479 |  5131.615–6842.065 |

The accompanying JSON retains every process result, sample count, timing percentiles, measurement order, artifact SHA-256 hashes, configuration, and environment metadata.
