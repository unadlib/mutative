# Mutative vs Immer workload benchmarks

Recorded: 2026-09-30T11:23:48.909Z. 3 independent Node processes; median of each process's mean time.

Local Mutative **1.3.0** at `3e206b05b7e131482a3febc766bab03b683a4049`; installed Immer **11.1.18**; Mitata **1.0.34**.

Environment: Apple M1 Max, 64 GiB RAM, darwin/arm64, Node v24.16.0, V8 13.6.233.17-node.49.

Fixture: array 1000, 10 nested items/row, objects with 1000/3000 properties; reuse 10 calls; RTKQ 100 pending + 100 resolved calls.

Both libraries use production artifacts. Array-method plugins are disabled. Freeze off uses unfrozen inputs; freeze on uses pre-frozen inputs and payloads. Construction, configuration, and correctness checks are outside timing. Each iteration resets to its immutable base and evolves it only within that scenario.

Enabled patch trials generate forward and inverse operations at every reducer call. Both libraries use array paths and index-based array removals (Mutative: arrayLengthAssignment false). Every producer tuple escapes; patch application, serialization, and accumulation are excluded from timing. Operation counts sum across all calls in the scenario.

Times are **microseconds per full scenario**, including natural GC. Ratio = Immer time / Mutative time; above 1 favors Mutative, below 1 favors Immer. These are scenario measurements, not a universal speedup. P99 describes Mitata samples, which can be batches of operations; it is not per-request tail latency.

## Auto-freeze off (unfrozen input); patches off

| Scenario        | Calls | Mutative µs | Immer µs |  I/M | Mutative sample p99 µs | Immer sample p99 µs |
| --------------- | ----: | ----------: | -------: | ---: | ---------------------: | ------------------: |
| add             |     1 |       3.325 |    2.894 | 0.87 |                  3.514 |               3.090 |
| remove          |     1 |     859.451 |  696.460 | 0.81 |               1122.000 |            1027.500 |
| mapNested       |     1 |     970.318 |  635.910 | 0.66 |               1376.083 |            1041.458 |
| update-high     |     1 |     307.962 |  217.080 | 0.70 |                423.000 |             312.500 |
| update-multiple |     1 |      12.020 |   10.037 | 0.84 |                 12.086 |              10.160 |
| reverse-array   |     1 |     877.564 |  696.534 | 0.79 |               1325.625 |            1045.083 |

Independent-process mean ranges (µs):

| Scenario        | Mutative min–max |   Immer min–max |
| --------------- | ---------------: | --------------: |
| add             |      3.233–3.363 |     2.841–2.983 |
| remove          |  836.847–871.624 | 689.823–699.045 |
| mapNested       |  956.816–976.706 | 633.679–638.135 |
| update-high     |  304.305–314.041 | 215.649–220.181 |
| update-multiple |    12.014–12.244 |   10.008–10.063 |
| reverse-array   |  871.941–890.463 | 690.356–700.227 |

## Auto-freeze off (unfrozen input); patches on

| Scenario        | Calls | Mutative µs | Immer µs |  I/M | Mutative sample p99 µs | Immer sample p99 µs |
| --------------- | ----: | ----------: | -------: | ---: | ---------------------: | ------------------: |
| add             |     1 |      19.631 |   30.042 | 1.53 |                 19.832 |              40.000 |
| remove          |     1 |   33003.604 |  880.735 | 0.03 |              33695.208 |            2175.959 |
| mapNested       |     1 |     970.228 |  637.130 | 0.66 |               1389.208 |            1051.375 |
| update-high     |     1 |     312.698 |  221.835 | 0.71 |                411.125 |             362.708 |
| update-multiple |     1 |      17.128 |   18.190 | 1.06 |                 17.293 |              18.277 |
| reverse-array   |     1 |   32704.867 |  875.262 | 0.03 |              33380.791 |            2219.417 |

Patch operations per full scenario:

| Scenario        | Mutative forward / inverse | Immer forward / inverse |
| --------------- | -------------------------: | ----------------------: |
| add             |                      1 / 1 |                   1 / 1 |
| remove          |                1000 / 1000 |             1000 / 1000 |
| mapNested       |                      1 / 1 |                   1 / 1 |
| update-high     |                      2 / 2 |                   2 / 2 |
| update-multiple |                    10 / 10 |                 10 / 10 |
| reverse-array   |                1000 / 1000 |             1000 / 1000 |

Independent-process mean ranges (µs):

| Scenario        |    Mutative min–max |   Immer min–max |
| --------------- | ------------------: | --------------: |
| add             |       19.326–19.988 |   30.008–30.122 |
| remove          | 32344.516–33607.008 | 870.458–883.816 |
| mapNested       |     969.664–979.501 | 635.993–642.154 |
| update-high     |     307.632–313.243 | 220.346–222.004 |
| update-multiple |       17.117–17.363 |   18.114–18.253 |
| reverse-array   | 32003.338–33530.255 | 874.827–876.616 |

## Auto-freeze on (pre-frozen input); patches off

| Scenario        | Calls | Mutative µs | Immer µs |  I/M | Mutative sample p99 µs | Immer sample p99 µs |
| --------------- | ----: | ----------: | -------: | ---: | ---------------------: | ------------------: |
| add             |     1 |      42.214 |   90.611 | 2.15 |                 60.375 |             122.042 |
| remove          |     1 |     897.256 |  778.688 | 0.87 |               1243.917 |            1125.542 |
| mapNested       |     1 |    1013.631 |  723.480 | 0.71 |               1380.542 |            1169.083 |
| update-high     |     1 |     346.809 |  306.111 | 0.88 |                471.250 |             432.750 |
| update-multiple |     1 |      53.744 |   97.445 | 1.81 |                 85.750 |             126.125 |
| reverse-array   |     1 |     933.939 |  788.404 | 0.84 |               1380.917 |            1121.750 |

Independent-process mean ranges (µs):

| Scenario        |  Mutative min–max |   Immer min–max |
| --------------- | ----------------: | --------------: |
| add             |     41.906–45.178 |   90.224–92.075 |
| remove          |   896.936–908.205 | 778.247–783.948 |
| mapNested       | 1006.240–1013.707 | 721.980–729.191 |
| update-high     |   345.293–372.259 | 305.659–307.369 |
| update-multiple |     53.548–54.386 |   96.986–99.277 |
| reverse-array   |   912.440–945.436 | 780.671–794.214 |

## Auto-freeze on (pre-frozen input); patches on

| Scenario        | Calls | Mutative µs | Immer µs |  I/M | Mutative sample p99 µs | Immer sample p99 µs |
| --------------- | ----: | ----------: | -------: | ---: | ---------------------: | ------------------: |
| add             |     1 |      59.643 |  118.039 | 1.98 |                 91.833 |             165.833 |
| remove          |     1 |   33099.950 |  962.779 | 0.03 |              34391.250 |            2267.083 |
| mapNested       |     1 |    1013.831 |  727.550 | 0.72 |               1425.916 |            1160.208 |
| update-high     |     1 |     353.415 |  312.598 | 0.88 |                514.750 |             469.083 |
| update-multiple |     1 |      60.421 |  109.448 | 1.81 |                 88.417 |             148.167 |
| reverse-array   |     1 |   33931.006 |  967.966 | 0.03 |              34508.333 |            2278.334 |

Patch operations per full scenario:

| Scenario        | Mutative forward / inverse | Immer forward / inverse |
| --------------- | -------------------------: | ----------------------: |
| add             |                      1 / 1 |                   1 / 1 |
| remove          |                1000 / 1000 |             1000 / 1000 |
| mapNested       |                      1 / 1 |                   1 / 1 |
| update-high     |                      2 / 2 |                   2 / 2 |
| update-multiple |                    10 / 10 |                 10 / 10 |
| reverse-array   |                1000 / 1000 |             1000 / 1000 |

Independent-process mean ranges (µs):

| Scenario        |    Mutative min–max |   Immer min–max |
| --------------- | ------------------: | --------------: |
| add             |       58.927–60.663 | 115.604–118.666 |
| remove          | 32816.849–33933.617 | 947.353–964.767 |
| mapNested       |   1003.815–1023.573 | 723.881–730.404 |
| update-high     |     352.441–369.916 | 310.497–314.190 |
| update-multiple |       57.694–61.024 | 107.314–110.702 |
| reverse-array   | 33133.492–34117.189 | 954.853–972.124 |

The accompanying JSON retains every process result, sample count, timing percentiles, measurement order, artifact SHA-256 hashes, configuration, and environment metadata.
