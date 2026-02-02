# Mutative Array Operations CPU Profile Analysis (current)

## Profile Summary

- **Profile file:** `cpu-profile-array.cpuprofile`
- **Duration:** 15.96s
- **Total nodes:** 341
- **Total samples:** 12575
- **Total functions:** 53

## Top Hotspots (by self-time)

| Rank | Function | Self% | Hits | Location |
|------|----------|-------|------|----------|
| 1 | `(garbage collector)` | 34.79% | 4368 | `` |
| 2 | `(anonymous)` | 18.30% | 2297 | `test/performance/pprof-array-profile.ts:194` |
| 3 | `set` | 9.95% | 1249 | `dist/mutative.cjs.production.min.js:1` |
| 4 | `get` | 8.79% | 1103 | `dist/mutative.cjs.production.min.js:1` |
| 5 | `f` | 8.13% | 1021 | `dist/mutative.cjs.production.min.js:1` |
| 6 | `(anonymous)` | 6.98% | 876 | `dist/mutative.cjs.production.min.js:1` |
| 7 | `X` | 3.15% | 396 | `dist/mutative.cjs.production.min.js:1` |
| 8 | `d` | 2.73% | 343 | `dist/mutative.cjs.production.min.js:1` |
| 9 | `q` | 2.11% | 265 | `dist/mutative.cjs.production.min.js:1` |
| 10 | `getPrototypeOf` | 1.29% | 162 | `dist/mutative.cjs.production.min.js:1` |
| 11 | `N` | 0.97% | 122 | `dist/mutative.cjs.production.min.js:1` |
| 12 | `has` | 0.51% | 64 | `dist/mutative.cjs.production.min.js:1` |
| 13 | `k` | 0.49% | 62 | `dist/mutative.cjs.production.min.js:1` |
| 14 | `v` | 0.41% | 52 | `dist/mutative.cjs.production.min.js:1` |
| 15 | `C` | 0.39% | 49 | `dist/mutative.cjs.production.min.js:1` |
| 16 | `a` | 0.34% | 43 | `dist/mutative.cjs.production.min.js:1` |
| 17 | `O` | 0.23% | 29 | `dist/mutative.cjs.production.min.js:1` |
| 18 | `m` | 0.21% | 26 | `dist/mutative.cjs.production.min.js:1` |
| 19 | `b` | 0.12% | 15 | `dist/mutative.cjs.production.min.js:1` |
| 20 | `_` | 0.05% | 6 | `dist/mutative.cjs.production.min.js:1` |
| 21 | `t` | 0.01% | 1 | `dist/mutative.cjs.production.min.js:1` |
| 22 | `D` | 0.01% | 1 | `dist/mutative.cjs.production.min.js:1` |
| 23 | `w` | 0.01% | 1 | `dist/mutative.cjs.production.min.js:1` |
| 24 | `E` | 0.01% | 1 | `dist/mutative.cjs.production.min.js:1` |
| 25 | `s` | 0.01% | 1 | `dist/mutative.cjs.production.min.js:1` |
| 26 | `testReverse` | 0.01% | 1 | `test/performance/pprof-array-profile.ts:184` |

## Mutative-Specific Hotspots

以下是与 mutative 库相关的热点函数（按 self-time 排序）：

| Function | Self% | Hits | Children | Location |
|----------|-------|------|----------|----------|
| `set` | 9.95% | 1249 | S, N, f... | `dist/mutative.cjs.production.min.js:1` |
| `get` | 8.79% | 1103 | X, S, m... | `dist/mutative.cjs.production.min.js:1` |
| `f` | 8.13% | 1021 | get | `dist/mutative.cjs.production.min.js:1` |
| `(anonymous)` | 6.98% | 876 | q, f, v... | `dist/mutative.cjs.production.min.js:1` |
| `X` | 3.15% | 396 |  | `dist/mutative.cjs.production.min.js:1` |
| `d` | 2.73% | 343 | getPrototypeOf | `dist/mutative.cjs.production.min.js:1` |
| `q` | 2.11% | 265 | O | `dist/mutative.cjs.production.min.js:1` |
| `getPrototypeOf` | 1.29% | 162 |  | `dist/mutative.cjs.production.min.js:1` |
| `N` | 0.97% | 122 | f, d | `dist/mutative.cjs.production.min.js:1` |
| `has` | 0.51% | 64 | has | `dist/mutative.cjs.production.min.js:1` |
| `k` | 0.49% | 62 |  | `dist/mutative.cjs.production.min.js:1` |
| `v` | 0.41% | 52 |  | `dist/mutative.cjs.production.min.js:1` |
| `C` | 0.39% | 49 | _, b | `dist/mutative.cjs.production.min.js:1` |
| `a` | 0.34% | 43 |  | `dist/mutative.cjs.production.min.js:1` |
| `O` | 0.23% | 29 |  | `dist/mutative.cjs.production.min.js:1` |
| `m` | 0.21% | 26 | f | `dist/mutative.cjs.production.min.js:1` |
| `b` | 0.12% | 15 |  | `dist/mutative.cjs.production.min.js:1` |
| `_` | 0.05% | 6 | u, D | `dist/mutative.cjs.production.min.js:1` |
| `t` | 0.01% | 1 | R, d | `dist/mutative.cjs.production.min.js:1` |
| `D` | 0.01% | 1 |  | `dist/mutative.cjs.production.min.js:1` |

## Key Observations

- **Proxy 相关操作:** 20.03% of CPU time
  - 主要函数: set, get, getPrototypeOf
- **Array 操作:** 0.00% of CPU time
  - 主要函数: testUnshift, createTestArray
- **Native 函数:** 34.79% of CPU time

## Potential Performance Improvements

基于 profile 分析，以下是 mutative 可能的性能改进方向：

### 1. Proxy Handler 优化

- **减少 Proxy trap 调用次数**: 对于频繁访问的属性，考虑缓存
- **优化 `get` trap**: 减少不必要的检查和类型判断
- **延迟代理创建**: 只在需要时创建嵌套对象的代理
- **内联热路径代码**: 减少函数调用开销

### 2. 数组操作优化

- **批量操作支持**: 对于连续的 push/pop 操作，可以批量处理
- **splice 优化**: 减少中间数组的创建，使用原地操作
- **shift/unshift 优化**: 考虑使用双端队列结构优化头部操作
- **避免不必要的 copy**: 如果只是读取，不要触发 copy-on-write

### 3. 内存分配优化

- **对象池**: 对于频繁创建的临时对象（如 ProxyDraft），使用对象池
- **减少闭包创建**: 避免在热路径中创建新的函数/闭包
- **预分配数组空间**: 对于已知大小的数组操作，预分配空间

### 4. 结构性优化

- **Copy-on-Write 优化**: 延迟复制，只在真正需要修改时才复制
- **增量更新**: 对于大数组，考虑使用增量更新而不是完整复制
- **Immutable 快速路径**: 对于未修改的子树，直接复用原引用
- **Finalization 优化**: 减少 finalize 阶段的遍历开销