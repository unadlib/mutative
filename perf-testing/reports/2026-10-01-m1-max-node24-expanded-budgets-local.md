# Performance regression budgets

Status: **passed**. Each row uses paired candidate/base ratios and deltas; a regression exceeds both the relative budget and the absolute noise floor.

| Metric / scenario / freeze / patches | Base median | Candidate median | Paired median ratio | Allowed ratio | Median delta | Noise floor | Status |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| latency/["read-index",false,false] | 770631.30 | 516623.90 | 0.667 | 1.30 | -256276.14 | 500 | passed |
| latency/["read-index",false,true] | 773732.75 | 514943.74 | 0.666 | 1.30 | -258789.00 | 500 | passed |
| latency/["read-index",true,false] | 777714.21 | 518453.34 | 0.669 | 1.30 | -256976.17 | 500 | passed |
| latency/["read-index",true,true] | 778883.14 | 519769.51 | 0.669 | 1.30 | -258750.10 | 500 | passed |
| latency/["small-object-update",false,false] | 1091.58 | 647.14 | 0.592 | 1.30 | -445.22 | 500 | passed |
| latency/["small-object-update",false,true] | 1448.71 | 966.02 | 0.669 | 1.30 | -478.30 | 500 | passed |
| latency/["small-object-update",true,false] | 1246.97 | 802.08 | 0.642 | 1.30 | -448.12 | 500 | passed |
| latency/["small-object-update",true,true] | 1606.32 | 1120.81 | 0.699 | 1.30 | -480.23 | 500 | passed |
| latency/["mutation-density-100pct",false,false] | 1238858.75 | 639979.70 | 0.517 | 1.30 | -597794.85 | 500 | passed |
| latency/["mutation-density-100pct",false,true] | 1998106.62 | 1128349.01 | 0.569 | 1.30 | -862081.25 | 500 | passed |
| latency/["mutation-density-100pct",true,false] | 1403084.52 | 812776.06 | 0.579 | 1.30 | -590308.46 | 500 | passed |
| latency/["mutation-density-100pct",true,true] | 2179115.96 | 1300137.64 | 0.599 | 1.30 | -878467.29 | 500 | passed |
| latency/["array-reverse-primitive",false,false] | 414041.74 | 270861.47 | 0.653 | 1.30 | -143650.54 | 500 | passed |
| latency/["array-reverse-primitive",false,true] | 547330.49 | 441859.89 | 0.808 | 1.30 | -104809.52 | 500 | passed |
| latency/["array-reverse-primitive",true,false] | 423795.58 | 279982.29 | 0.660 | 1.30 | -144231.60 | 500 | passed |
| latency/["array-reverse-primitive",true,true] | 561497.88 | 455135.64 | 0.810 | 1.30 | -106086.83 | 500 | passed |
| latency/["array-shift-nested",false,false] | 832548.66 | 466217.98 | 0.558 | 1.30 | -367829.77 | 500 | passed |
| latency/["array-shift-nested",false,true] | 26133045.71 | 611740.23 | 0.023 | 1.30 | -25521305.49 | 500 | passed |
| latency/["array-shift-nested",true,false] | 855638.50 | 491883.48 | 0.572 | 1.30 | -365710.59 | 500 | passed |
| latency/["array-shift-nested",true,true] | 26832250.05 | 633209.07 | 0.024 | 1.30 | -26194690.95 | 500 | passed |
| latency/["array-unshift-nested",false,false] | 833602.16 | 469390.41 | 0.566 | 1.30 | -360556.37 | 500 | passed |
| latency/["array-unshift-nested",false,true] | 26352868.95 | 617017.04 | 0.024 | 1.30 | -25732013.43 | 500 | passed |
| latency/["array-unshift-nested",true,false] | 856044.30 | 490140.66 | 0.570 | 1.30 | -368284.86 | 500 | passed |
| latency/["array-unshift-nested",true,true] | 27211537.55 | 640556.61 | 0.023 | 1.30 | -26572970.81 | 500 | passed |
| latency/["array-splice-insert-nested",false,false] | 419029.34 | 237515.78 | 0.566 | 1.30 | -181809.75 | 500 | passed |
| latency/["array-splice-insert-nested",false,true] | 12836267.22 | 311522.41 | 0.024 | 1.30 | -12526345.94 | 500 | passed |
| latency/["array-splice-insert-nested",true,false] | 437147.88 | 257715.60 | 0.590 | 1.30 | -179062.69 | 500 | passed |
| latency/["array-splice-insert-nested",true,true] | 13046237.28 | 333652.43 | 0.026 | 1.30 | -12712409.66 | 500 | passed |
| latency/["array-reverse-nested",false,false] | 857685.11 | 472675.76 | 0.550 | 1.30 | -386174.54 | 500 | passed |
| latency/["array-reverse-nested",false,true] | 25922073.48 | 663627.66 | 0.026 | 1.30 | -25256996.55 | 500 | passed |
| latency/["array-reverse-nested",true,false] | 880262.81 | 498231.57 | 0.568 | 1.30 | -379546.28 | 500 | passed |
| latency/["array-reverse-nested",true,true] | 27323179.10 | 692923.61 | 0.025 | 1.30 | -26627960.41 | 500 | passed |
| allocation/["mutation-density-100pct",false,false] | 2317491.50 | 1553093.00 | 0.673 | 1.35 | -760640.00 | 8192 | passed |
| retainedHeap/["mutation-density-100pct",false,false] | 122817.50 | 88086.00 | 0.717 | 1.35 | -34732.50 | 1024 | passed |
| allocation/["mutation-density-100pct",false,true] | 3057591.50 | 2254410.50 | 0.738 | 1.35 | -801621.50 | 8192 | passed |
| retainedHeap/["mutation-density-100pct",false,true] | 320715.50 | 272579.50 | 0.850 | 1.35 | -48136.00 | 1024 | passed |
| allocation/["mutation-density-100pct",true,false] | 2740791.00 | 1966081.50 | 0.719 | 1.35 | -770718.50 | 8192 | passed |
| retainedHeap/["mutation-density-100pct",true,false] | 122940.50 | 88097.00 | 0.717 | 1.35 | -34843.50 | 1024 | passed |
| allocation/["mutation-density-100pct",true,true] | 3461987.00 | 2649189.00 | 0.764 | 1.35 | -816045.50 | 8192 | passed |
| retainedHeap/["mutation-density-100pct",true,true] | 320775.00 | 271934.00 | 0.848 | 1.35 | -48841.00 | 1024 | passed |
| allocation/["array-reverse-nested",false,false] | 1275247.50 | 847384.50 | 0.661 | 1.35 | -433387.00 | 8192 | passed |
| retainedHeap/["array-reverse-nested",false,false] | 6456.50 | 8088.00 | 1.252 | 1.35 | 1629.50 | 1024 | passed |
| allocation/["array-reverse-nested",false,true] | 27445714.00 | 1210743.50 | 0.044 | 1.35 | -26231015.00 | 8192 | passed |
| retainedHeap/["array-reverse-nested",false,true] | 1020346.50 | 188878.00 | 0.185 | 1.35 | -831468.50 | 1024 | passed |
| allocation/["array-reverse-nested",true,false] | 1298080.00 | 886038.00 | 0.673 | 1.35 | -427549.00 | 8192 | passed |
| retainedHeap/["array-reverse-nested",true,false] | 7034.00 | 8092.00 | 1.150 | 1.35 | 1058.00 | 1024 | passed |
| allocation/["array-reverse-nested",true,true] | 27520683.50 | 1251798.00 | 0.045 | 1.35 | -26268885.50 | 8192 | passed |
| retainedHeap/["array-reverse-nested",true,true] | 1020201.00 | 188884.00 | 0.185 | 1.35 | -831317.00 | 1024 | passed |

Latency values are ns per scenario. Allocation and retained-heap values are bytes per scenario output. JSON retains all individual pairs. Signed retained-heap estimates near zero require the absolute floor; RSS snapshots are recorded but not gated.
