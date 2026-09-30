# Performance regression budgets

Status: **passed**. Each row uses paired candidate/base ratios and deltas; a regression exceeds both the relative budget and the absolute noise floor.

| Metric / scenario / freeze / patches                 | Base median | Candidate median | Paired median ratio | Allowed ratio | Median delta | Noise floor | Status |
| ---------------------------------------------------- | ----------: | ---------------: | ------------------: | ------------: | -----------: | ----------: | ------ |
| latency/["read-index",false,false]                   |   779135.83 |        778332.11 |               0.999 |          1.30 |     -1015.74 |         500 | passed |
| latency/["read-index",false,true]                    |   777942.70 |        777694.36 |               0.998 |          1.30 |     -1384.28 |         500 | passed |
| latency/["read-index",true,false]                    |   781329.35 |        783179.80 |               1.001 |          1.30 |       521.92 |         500 | passed |
| latency/["read-index",true,true]                     |   782658.56 |        781768.73 |               1.003 |          1.30 |      2395.16 |         500 | passed |
| latency/["small-object-update",false,false]          |     1094.62 |          1096.14 |               1.003 |          1.30 |         3.33 |         500 | passed |
| latency/["small-object-update",false,true]           |     1450.39 |          1455.25 |               1.007 |          1.30 |         9.43 |         500 | passed |
| latency/["small-object-update",true,false]           |     1259.60 |          1262.74 |               1.005 |          1.30 |         6.83 |         500 | passed |
| latency/["small-object-update",true,true]            |     1613.14 |          1610.25 |               1.001 |          1.30 |         1.45 |         500 | passed |
| latency/["mutation-density-100pct",false,false]      |  1245358.43 |       1250102.60 |               1.002 |          1.30 |      2189.30 |         500 | passed |
| latency/["mutation-density-100pct",false,true]       |  2011998.04 |       2017221.05 |               1.003 |          1.30 |      5489.63 |         500 | passed |
| latency/["mutation-density-100pct",true,false]       |  1416887.63 |       1429233.45 |               1.006 |          1.30 |      8563.98 |         500 | passed |
| latency/["mutation-density-100pct",true,true]        |  2195584.77 |       2200841.34 |               1.003 |          1.30 |      6598.05 |         500 | passed |
| latency/["array-reverse-primitive",false,false]      |   419966.92 |        417447.48 |               0.992 |          1.30 |     -3378.01 |         500 | passed |
| latency/["array-reverse-primitive",false,true]       |   554655.09 |        552188.68 |               1.009 |          1.30 |      5119.32 |         500 | passed |
| latency/["array-reverse-primitive",true,false]       |   426952.83 |        425516.60 |               0.998 |          1.30 |      -760.91 |         500 | passed |
| latency/["array-reverse-primitive",true,true]        |   564776.88 |        565331.51 |               1.001 |          1.30 |       575.23 |         500 | passed |
| latency/["array-shift-nested",false,false]           |   842202.73 |        844206.01 |               1.005 |          1.30 |      3884.30 |         500 | passed |
| latency/["array-shift-nested",false,true]            | 26152329.38 |      27051022.85 |               1.004 |          1.30 |     96676.38 |         500 | passed |
| latency/["array-shift-nested",true,false]            |   866772.14 |        871592.15 |               1.000 |          1.30 |      -143.12 |         500 | passed |
| latency/["array-shift-nested",true,true]             | 27072106.20 |      27486866.55 |               1.006 |          1.30 |    167615.21 |         500 | passed |
| latency/["array-unshift-nested",false,false]         |   843226.71 |        847846.63 |               1.005 |          1.30 |      4619.92 |         500 | passed |
| latency/["array-unshift-nested",false,true]          | 26881154.25 |      26887506.35 |               1.000 |          1.30 |      6352.10 |         500 | passed |
| latency/["array-unshift-nested",true,false]          |   861385.52 |        866618.71 |               1.005 |          1.30 |      4066.16 |         500 | passed |
| latency/["array-unshift-nested",true,true]           | 27073700.05 |      27310939.70 |               1.010 |          1.30 |    257681.55 |         500 | passed |
| latency/["array-splice-insert-nested",false,false]   |   423788.74 |        427787.32 |               1.006 |          1.30 |      2479.11 |         500 | passed |
| latency/["array-splice-insert-nested",false,true]    | 13030647.59 |      13338714.82 |               1.029 |          1.30 |    372744.44 |         500 | passed |
| latency/["array-splice-insert-nested",true,false]    |   446803.37 |        443672.18 |               0.994 |          1.30 |     -2794.31 |         500 | passed |
| latency/["array-splice-insert-nested",true,true]     | 13029441.11 |      13357538.86 |               1.025 |          1.30 |    328097.75 |         500 | passed |
| latency/["array-reverse-nested",false,false]         |   868809.16 |        875771.60 |               1.006 |          1.30 |      4976.60 |         500 | passed |
| latency/["array-reverse-nested",false,true]          | 27207277.15 |      26941070.85 |               0.995 |          1.30 |   -125204.10 |         500 | passed |
| latency/["array-reverse-nested",true,false]          |   887088.43 |        894526.09 |               1.002 |          1.30 |      2164.01 |         500 | passed |
| latency/["array-reverse-nested",true,true]           | 27257375.10 |      28542142.53 |               1.033 |          1.30 |    907894.84 |         500 | passed |
| allocation/["mutation-density-100pct",false,false]   |  2317299.50 |       2318605.50 |               1.001 |          1.35 |      1306.00 |        8192 | passed |
| retainedHeap/["mutation-density-100pct",false,false] |   122817.50 |        122817.50 |               1.000 |          1.35 |         0.00 |        1024 | passed |
| allocation/["mutation-density-100pct",false,true]    |  3050044.00 |       3041561.50 |               0.995 |          1.35 |    -14638.50 |        8192 | passed |
| retainedHeap/["mutation-density-100pct",false,true]  |   320715.50 |        320715.50 |               1.000 |          1.35 |         0.00 |        1024 | passed |
| allocation/["mutation-density-100pct",true,false]    |  2735645.00 |       2711011.50 |               0.995 |          1.35 |    -13258.00 |        8192 | passed |
| retainedHeap/["mutation-density-100pct",true,false]  |   122922.50 |        122922.50 |               1.000 |          1.35 |        -1.50 |        1024 | passed |
| allocation/["mutation-density-100pct",true,true]     |  3455072.00 |       3481293.50 |               1.005 |          1.35 |     17642.50 |        8192 | passed |
| retainedHeap/["mutation-density-100pct",true,true]   |   320775.00 |        320775.00 |               1.000 |          1.35 |         0.00 |        1024 | passed |
| allocation/["array-reverse-nested",false,false]      |  1268047.50 |       1272018.00 |               1.002 |          1.35 |      2734.00 |        8192 | passed |
| retainedHeap/["array-reverse-nested",false,false]    |     6444.50 |          6444.50 |               1.000 |          1.35 |        -2.00 |        1024 | passed |
| allocation/["array-reverse-nested",false,true]       | 27421825.00 |      27386490.50 |               0.999 |          1.35 |    -32008.00 |        8192 | passed |
| retainedHeap/["array-reverse-nested",false,true]     |  1020263.00 |       1020332.50 |               1.000 |          1.35 |       103.00 |        1024 | passed |
| allocation/["array-reverse-nested",true,false]       |  1302259.50 |       1309841.50 |               1.000 |          1.35 |       459.00 |        8192 | passed |
| retainedHeap/["array-reverse-nested",true,false]     |     7027.00 |          7027.00 |               1.000 |          1.35 |         0.00 |        1024 | passed |
| allocation/["array-reverse-nested",true,true]        | 27600051.00 |      27535641.00 |               0.997 |          1.35 |    -73257.50 |        8192 | passed |
| retainedHeap/["array-reverse-nested",true,true]      |  1020201.00 |       1020366.00 |               1.000 |          1.35 |       167.00 |        1024 | passed |

Latency values are ns per scenario. Allocation and retained-heap values are bytes per scenario output. JSON retains all individual pairs. Signed retained-heap estimates near zero require the absolute floor; RSS snapshots are recorded but not gated.
