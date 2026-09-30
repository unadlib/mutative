# Mutative vs Immer workload benchmarks

Recorded: 2026-09-30T11:27:32.121Z. 3 independent Node processes; median of each process's mean time.

Local Mutative **1.3.0** at `3e206b05b7e131482a3febc766bab03b683a4049`; installed Immer **11.1.18**; Mitata **1.0.34**.

Environment: Apple M1 Max, 64 GiB RAM, darwin/arm64, Node v24.16.0, V8 13.6.233.17-node.49.

Fixture: array 10000, 10 nested items/row, objects with 1000/3000 properties; reuse 10 calls; RTKQ 100 pending + 100 resolved calls.

Both libraries use production artifacts. Array-method plugins are disabled. Freeze off uses unfrozen inputs; freeze on uses pre-frozen inputs and payloads. Construction, configuration, and correctness checks are outside timing. Each iteration resets to its immutable base and evolves it only within that scenario.

Enabled patch trials generate forward and inverse operations at every reducer call. Both libraries use array paths and index-based array removals (Mutative: arrayLengthAssignment false). Every producer tuple escapes; patch application, serialization, and accumulation are excluded from timing. Operation counts sum across all calls in the scenario.

Times are **microseconds per full scenario**, including natural GC. Ratio = Immer time / Mutative time; above 1 favors Mutative, below 1 favors Immer. These are scenario measurements, not a universal speedup. P99 describes Mitata samples, which can be batches of operations; it is not per-request tail latency.

## Auto-freeze off (unfrozen input); patches off

| Scenario        | Calls | Mutative µs | Immer µs |  I/M | Mutative sample p99 µs | Immer sample p99 µs |
| --------------- | ----: | ----------: | -------: | ---: | ---------------------: | ------------------: |
| add             |     1 |      10.833 |   10.638 | 0.98 |                 10.934 |              10.824 |
| remove          |     1 |   10871.874 | 8308.438 | 0.76 |              15130.792 |            9974.667 |
| mapNested       |     1 |   11360.588 | 7252.405 | 0.64 |              12333.250 |            8420.459 |
| update-high     |     1 |    3312.714 | 2228.288 | 0.67 |               4286.958 |            2720.917 |
| update-multiple |     1 |      14.515 |   11.866 | 0.82 |                 14.713 |              12.002 |
| reverse-array   |     1 |   11214.477 | 8562.665 | 0.76 |              16160.500 |           10068.917 |

Independent-process mean ranges (µs):

| Scenario        |    Mutative min–max |     Immer min–max |
| --------------- | ------------------: | ----------------: |
| add             |       10.659–10.860 |     10.576–10.721 |
| remove          |  9560.168–10957.612 | 8119.082–8351.742 |
| mapNested       | 11350.845–11367.135 | 7235.468–7401.566 |
| update-high     |   3293.799–3331.671 | 2226.046–2245.934 |
| update-multiple |       14.399–14.543 |     11.816–11.872 |
| reverse-array   | 10420.423–11561.662 | 8512.269–8719.035 |

## Auto-freeze off (unfrozen input); patches on

| Scenario        | Calls | Mutative µs |  Immer µs |  I/M | Mutative sample p99 µs | Immer sample p99 µs |
| --------------- | ----: | ----------: | --------: | ---: | ---------------------: | ------------------: |
| add             |     1 |     166.352 |   266.852 | 1.60 |                203.917 |             307.625 |
| remove          |     1 |  338697.285 | 10342.811 | 0.03 |             343760.208 |           12118.333 |
| mapNested       |     1 |   11361.867 |  7253.655 | 0.64 |              12506.667 |            8439.667 |
| update-high     |     1 |    3316.142 |  2257.699 | 0.68 |               4376.000 |            3020.667 |
| update-multiple |     1 |      19.641 |    20.029 | 1.02 |                 19.997 |              20.131 |
| reverse-array   |     1 |  341745.896 | 10535.553 | 0.03 |             346973.292 |           12978.583 |

Patch operations per full scenario:

| Scenario        | Mutative forward / inverse | Immer forward / inverse |
| --------------- | -------------------------: | ----------------------: |
| add             |                      1 / 1 |                   1 / 1 |
| remove          |              10000 / 10000 |           10000 / 10000 |
| mapNested       |                      1 / 1 |                   1 / 1 |
| update-high     |                      2 / 2 |                   2 / 2 |
| update-multiple |                    10 / 10 |                 10 / 10 |
| reverse-array   |              10000 / 10000 |           10000 / 10000 |

Independent-process mean ranges (µs):

| Scenario        |      Mutative min–max |       Immer min–max |
| --------------- | --------------------: | ------------------: |
| add             |       163.384–167.897 |     266.513–270.960 |
| remove          | 336184.062–361305.774 | 10235.487–10415.566 |
| mapNested       |   11320.089–11378.954 |   7238.656–7267.384 |
| update-high     |     3288.336–3320.532 |   2240.824–2259.202 |
| update-multiple |         19.501–19.669 |       19.977–20.344 |
| reverse-array   | 338639.038–351776.833 | 10228.688–10735.042 |

## Auto-freeze on (pre-frozen input); patches off

| Scenario        | Calls | Mutative µs | Immer µs |  I/M | Mutative sample p99 µs | Immer sample p99 µs |
| --------------- | ----: | ----------: | -------: | ---: | ---------------------: | ------------------: |
| add             |     1 |     268.421 |  740.021 | 2.76 |                454.208 |             874.625 |
| remove          |     1 |   11070.010 | 9239.047 | 0.83 |              15689.750 |           10688.083 |
| mapNested       |     1 |   11984.025 | 8326.963 | 0.69 |              12716.667 |            9641.958 |
| update-high     |     1 |    3676.145 | 3056.838 | 0.83 |               4783.459 |            3657.542 |
| update-multiple |     1 |     274.516 |  740.135 | 2.70 |                476.208 |             987.958 |
| reverse-array   |     1 |   11808.749 | 9354.763 | 0.79 |              16559.542 |           10841.625 |

Independent-process mean ranges (µs):

| Scenario        |    Mutative min–max |     Immer min–max |
| --------------- | ------------------: | ----------------: |
| add             |     263.578–270.576 |   737.347–740.134 |
| remove          | 10051.730–11199.815 | 9076.795–9466.434 |
| mapNested       | 11751.922–11990.929 | 8266.394–8365.163 |
| update-high     |   3638.677–3915.155 | 3022.430–3147.872 |
| update-multiple |     274.458–277.913 |   736.289–747.855 |
| reverse-array   | 10480.808–11810.176 | 9342.187–9544.475 |

## Auto-freeze on (pre-frozen input); patches on

| Scenario        | Calls | Mutative µs |  Immer µs |  I/M | Mutative sample p99 µs | Immer sample p99 µs |
| --------------- | ----: | ----------: | --------: | ---: | ---------------------: | ------------------: |
| add             |     1 |     422.007 |   987.143 | 2.34 |                619.250 |            1300.125 |
| remove          |     1 |  341802.372 | 10963.676 | 0.03 |             346888.750 |           12905.750 |
| mapNested       |     1 |   11914.879 |  8393.229 | 0.70 |              12720.833 |            9641.333 |
| update-high     |     1 |    3664.737 |  3077.313 | 0.84 |               5017.584 |            3748.917 |
| update-multiple |     1 |     280.152 |   755.435 | 2.70 |                486.000 |             971.917 |
| reverse-array   |     1 |  342821.261 | 11198.557 | 0.03 |             348291.083 |           13448.917 |

Patch operations per full scenario:

| Scenario        | Mutative forward / inverse | Immer forward / inverse |
| --------------- | -------------------------: | ----------------------: |
| add             |                      1 / 1 |                   1 / 1 |
| remove          |              10000 / 10000 |           10000 / 10000 |
| mapNested       |                      1 / 1 |                   1 / 1 |
| update-high     |                      2 / 2 |                   2 / 2 |
| update-multiple |                    10 / 10 |                 10 / 10 |
| reverse-array   |              10000 / 10000 |           10000 / 10000 |

Independent-process mean ranges (µs):

| Scenario        |      Mutative min–max |       Immer min–max |
| --------------- | --------------------: | ------------------: |
| add             |       414.820–426.980 |    976.041–1009.997 |
| remove          | 339738.288–365320.090 | 10616.330–11026.578 |
| mapNested       |   11891.677–12004.794 |   8364.031–8609.072 |
| update-high     |     3638.923–3722.534 |   3070.279–3125.511 |
| update-multiple |       279.601–283.312 |     751.908–760.456 |
| reverse-array   | 341574.142–362034.045 | 11186.936–11394.905 |

The accompanying JSON retains every process result, sample count, timing percentiles, measurement order, artifact SHA-256 hashes, configuration, and environment metadata.
