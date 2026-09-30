# Performance regression budgets

Status: **passed**. Each row uses paired candidate/base ratios and deltas; a regression exceeds both the relative budget and the absolute noise floor.

| Metric / scenario / freeze / patches                 | Base median | Candidate median | Paired median ratio | Allowed ratio | Median delta | Noise floor | Status |
| ---------------------------------------------------- | ----------: | ---------------: | ------------------: | ------------: | -----------: | ----------: | ------ |
| latency/["read-index",false,false]                   |   845168.77 |        828814.44 |               0.985 |          1.30 |    -13556.99 |         500 | passed |
| latency/["read-index",false,true]                    |   818018.39 |        837318.13 |               1.007 |          1.30 |      5303.03 |         500 | passed |
| latency/["read-index",true,false]                    |   831012.80 |        826021.49 |               0.994 |          1.30 |     -4991.32 |         500 | passed |
| latency/["read-index",true,true]                     |   825062.64 |        818906.50 |               1.005 |          1.30 |      3929.78 |         500 | passed |
| latency/["small-object-update",false,false]          |     1272.16 |          1302.64 |               1.033 |          1.30 |        40.98 |         500 | passed |
| latency/["small-object-update",false,true]           |     1990.51 |          1979.55 |               0.993 |          1.30 |       -14.58 |         500 | passed |
| latency/["small-object-update",true,false]           |     1491.41 |          1482.89 |               0.995 |          1.30 |        -7.14 |         500 | passed |
| latency/["small-object-update",true,true]            |     2275.96 |          2258.37 |               0.977 |          1.30 |       -53.53 |         500 | passed |
| latency/["mutation-density-100pct",false,false]      |  1446772.98 |       1475743.59 |               1.054 |          1.30 |     76216.36 |         500 | passed |
| latency/["mutation-density-100pct",false,true]       |  2753334.03 |       2761074.14 |               1.007 |          1.30 |     20272.42 |         500 | passed |
| latency/["mutation-density-100pct",true,false]       |  1713701.14 |       1717383.67 |               1.017 |          1.30 |     28700.31 |         500 | passed |
| latency/["mutation-density-100pct",true,true]        |  2783216.54 |       3054680.98 |               1.093 |          1.30 |    257497.89 |         500 | passed |
| latency/["array-reverse-primitive",false,false]      |   404214.47 |        406167.56 |               1.006 |          1.30 |      2235.19 |         500 | passed |
| latency/["array-reverse-primitive",false,true]       |   565514.59 |        568602.64 |               0.998 |          1.30 |      -921.48 |         500 | passed |
| latency/["array-reverse-primitive",true,false]       |   421438.45 |        422733.55 |               1.000 |          1.30 |      -136.22 |         500 | passed |
| latency/["array-reverse-primitive",true,true]        |   594602.97 |        595321.10 |               0.988 |          1.30 |     -7330.58 |         500 | passed |
| latency/["array-shift-nested",false,false]           |   890896.09 |        863823.20 |               0.975 |          1.30 |    -21442.29 |         500 | passed |
| latency/["array-shift-nested",false,true]            | 28910690.89 |      29494047.61 |               0.999 |          1.30 |    -20725.78 |         500 | passed |
| latency/["array-shift-nested",true,false]            |   872374.85 |        864027.78 |               0.982 |          1.30 |    -16047.37 |         500 | passed |
| latency/["array-shift-nested",true,true]             | 30471712.53 |      30550011.41 |               0.991 |          1.30 |   -250363.11 |         500 | passed |
| latency/["array-unshift-nested",false,false]         |   868536.68 |        857373.35 |               0.998 |          1.30 |     -1407.48 |         500 | passed |
| latency/["array-unshift-nested",false,true]          | 29318637.28 |      30275705.78 |               1.033 |          1.30 |    957068.50 |         500 | passed |
| latency/["array-unshift-nested",true,false]          |   873609.23 |        867715.36 |               0.992 |          1.30 |     -7375.89 |         500 | passed |
| latency/["array-unshift-nested",true,true]           | 29363422.33 |      29734926.83 |               1.001 |          1.30 |     20526.60 |         500 | passed |
| latency/["array-splice-insert-nested",false,false]   |   429863.70 |        418308.86 |               0.969 |          1.30 |    -13362.78 |         500 | passed |
| latency/["array-splice-insert-nested",false,true]    | 14385425.68 |      14840904.77 |               0.986 |          1.30 |   -201681.10 |         500 | passed |
| latency/["array-splice-insert-nested",true,false]    |   453887.03 |        430248.11 |               0.948 |          1.30 |    -24202.73 |         500 | passed |
| latency/["array-splice-insert-nested",true,true]     | 15468052.24 |      14738075.28 |               0.978 |          1.30 |   -333066.04 |         500 | passed |
| latency/["array-reverse-nested",false,false]         |   921507.38 |        996406.30 |               1.081 |          1.30 |     74898.92 |         500 | passed |
| latency/["array-reverse-nested",false,true]          | 30616077.00 |      29972072.06 |               1.002 |          1.30 |     52183.84 |         500 | passed |
| latency/["array-reverse-nested",true,false]          |  1016761.87 |        937947.08 |               0.964 |          1.30 |    -34021.09 |         500 | passed |
| latency/["array-reverse-nested",true,true]           | 30926431.53 |      29711212.33 |               0.961 |          1.30 |  -1215219.20 |         500 | passed |
| allocation/["mutation-density-100pct",false,false]   |  2198476.00 |       2197302.00 |               0.999 |          1.35 |     -1174.00 |        8192 | passed |
| retainedHeap/["mutation-density-100pct",false,false] |   123011.00 |        123011.00 |               1.000 |          1.35 |         0.00 |        1024 | passed |
| allocation/["mutation-density-100pct",false,true]    |  3070015.50 |       3065084.00 |               1.004 |          1.35 |     11512.00 |        8192 | passed |
| retainedHeap/["mutation-density-100pct",false,true]  |   320948.50 |        320946.50 |               1.000 |          1.35 |         0.00 |        1024 | passed |
| allocation/["mutation-density-100pct",true,false]    |  2681724.50 |       2676608.50 |               0.998 |          1.35 |     -6275.50 |        8192 | passed |
| retainedHeap/["mutation-density-100pct",true,false]  |   123096.50 |        123070.50 |               1.000 |          1.35 |       -26.00 |        1024 | passed |
| allocation/["mutation-density-100pct",true,true]     |  3472901.00 |       3398950.00 |               0.979 |          1.35 |    -73951.00 |        8192 | passed |
| retainedHeap/["mutation-density-100pct",true,true]   |   321004.00 |        320980.00 |               1.000 |          1.35 |       -24.00 |        1024 | passed |
| allocation/["array-reverse-nested",false,false]      |  1273577.50 |       1265670.00 |               0.992 |          1.35 |    -10336.00 |        8192 | passed |
| retainedHeap/["array-reverse-nested",false,false]    |     6368.00 |          7602.50 |               1.121 |          1.35 |       683.50 |        1024 | passed |
| allocation/["array-reverse-nested",false,true]       | 27453841.00 |      27454424.50 |               1.000 |          1.35 |     -6089.00 |        8192 | passed |
| retainedHeap/["array-reverse-nested",false,true]     |  1020533.50 |       1020330.50 |               1.000 |          1.35 |         0.00 |        1024 | passed |
| allocation/["array-reverse-nested",true,false]       |  1308133.50 |       1308189.50 |               1.000 |          1.35 |        56.00 |        8192 | passed |
| retainedHeap/["array-reverse-nested",true,false]     |     7600.50 |          8141.00 |               1.000 |          1.35 |         2.00 |        1024 | passed |
| allocation/["array-reverse-nested",true,true]        | 27539574.50 |      27581624.50 |               1.001 |          1.35 |     40617.50 |        8192 | passed |
| retainedHeap/["array-reverse-nested",true,true]      |  1020341.50 |       1020366.00 |               1.000 |          1.35 |       -84.50 |        1024 | passed |

Latency values are ns per scenario. Allocation and retained-heap values are bytes per scenario output. JSON retains all individual pairs. Signed retained-heap estimates near zero require the absolute floor; RSS snapshots are recorded but not gated.
