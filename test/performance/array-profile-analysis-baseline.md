# Mutative Array Operations CPU Profile Analysis (mutative@1.3.0 baseline)

## Profile Summary

- **Profile file:** `cpu-profile-array.cpuprofile`
- **Duration:** 17.69s
- **Total nodes:** 378
- **Total samples:** 13943
- **Total functions:** 61

## Top Hotspots (by self-time)

| Rank | Function | Self% | Hits | Location |
|------|----------|-------|------|----------|
| 1 | `(garbage collector)` | 31.62% | 4403 | `` |
| 2 | `(anonymous)` | 18.14% | 2526 | `test/performance/pprof-array-profile.ts:194` |
| 3 | `set` | 10.15% | 1413 | `node_modules/mutative-130/dist/mutative.cjs.development.js:1081` |
| 4 | `get` | 7.61% | 1059 | `node_modules/mutative-130/dist/mutative.cjs.development.js:1000` |
| 5 | `getProxyDraft` | 7.58% | 1055 | `node_modules/mutative-130/dist/mutative.cjs.development.js:54` |
| 6 | `getDescriptor` | 6.93% | 965 | `node_modules/mutative-130/dist/mutative.cjs.development.js:25` |
| 7 | `(anonymous)` | 5.92% | 824 | `node_modules/mutative-130/dist/mutative.cjs.development.js:1300` |
| 8 | `createDraft` | 2.88% | 401 | `node_modules/mutative-130/dist/mutative.cjs.development.js:1174` |
| 9 | `isDraftable` | 2.46% | 343 | `node_modules/mutative-130/dist/mutative.cjs.development.js:67` |
| 10 | `finalizeDraft` | 2.18% | 303 | `node_modules/mutative-130/dist/mutative.cjs.development.js:1240` |
| 11 | `getPrototypeOf` | 1.11% | 155 | `node_modules/mutative-130/dist/mutative.cjs.development.js:1144` |
| 12 | `has` | 1.01% | 141 | `node_modules/mutative-130/dist/mutative.cjs.development.js:20` |
| 13 | `markFinalization` | 0.74% | 103 | `node_modules/mutative-130/dist/mutative.cjs.development.js:481` |
| 14 | `shallowCopy` | 0.57% | 79 | `node_modules/mutative-130/dist/mutative.cjs.development.js:211` |
| 15 | `peek` | 0.40% | 56 | `node_modules/mutative-130/dist/mutative.cjs.development.js:131` |
| 16 | `revokeProxy` | 0.27% | 37 | `node_modules/mutative-130/dist/mutative.cjs.development.js:144` |
| 17 | `finalizeAssigned` | 0.25% | 35 | `node_modules/mutative-130/dist/mutative.cjs.development.js:449` |
| 18 | `handleValue` | 0.06% | 8 | `node_modules/mutative-130/dist/mutative.cjs.development.js:415` |
| 19 | `create` | 0.02% | 3 | `node_modules/mutative-130/dist/mutative.cjs.development.js:1431` |
| 20 | `draftify` | 0.01% | 2 | `node_modules/mutative-130/dist/mutative.cjs.development.js:1274` |
| 21 | `testSpliceAdd` | 0.01% | 2 | `test/performance/pprof-array-profile.ts:68` |
| 22 | `testShift` | 0.01% | 2 | `test/performance/pprof-array-profile.ts:91` |
| 23 | `testPush` | 0.01% | 1 | `test/performance/pprof-array-profile.ts:42` |
| 24 | `ensureShallowCopy` | 0.01% | 1 | `node_modules/mutative-130/dist/mutative.cjs.development.js:266` |
| 25 | `isEqual` | 0.01% | 1 | `node_modules/mutative-130/dist/mutative.cjs.development.js:136` |
| 26 | `finalizeSetValue` | 0.01% | 1 | `node_modules/mutative-130/dist/mutative.cjs.development.js:458` |
| 27 | `testSpliceDelete` | 0.01% | 1 | `test/performance/pprof-array-profile.ts:99` |
| 28 | `writeUtf8String` | 0.01% | 1 | `` |
| 29 | `markChanged` | 0.01% | 1 | `node_modules/mutative-130/dist/mutative.cjs.development.js:304` |
| 30 | `finalizePatches` | 0.01% | 1 | `node_modules/mutative-130/dist/mutative.cjs.development.js:466` |

## Mutative-Specific Hotspots

以下是与 mutative 库相关的热点函数（按 self-time 排序）：

| Function | Self% | Hits | Children | Location |
|----------|-------|------|----------|----------|
| `getProxyDraft` | 7.58% | 1055 | get | `node_modules/mutative-130/dist/mutative.cjs.development.js:54` |
| `createDraft` | 2.88% | 401 |  | `node_modules/mutative-130/dist/mutative.cjs.development.js:1174` |
| `finalizeDraft` | 2.18% | 303 | revokeProxy, finalizeSetValue | `node_modules/mutative-130/dist/mutative.cjs.development.js:1240` |
| `revokeProxy` | 0.27% | 37 |  | `node_modules/mutative-130/dist/mutative.cjs.development.js:144` |
| `finalizeAssigned` | 0.25% | 35 | handleValue, get | `node_modules/mutative-130/dist/mutative.cjs.development.js:449` |
| `create` | 0.02% | 3 | returnValue, draftify | `node_modules/mutative-130/dist/mutative.cjs.development.js:1431` |
| `draftify` | 0.01% | 2 |  | `node_modules/mutative-130/dist/mutative.cjs.development.js:1274` |
| `finalizeSetValue` | 0.01% | 1 |  | `node_modules/mutative-130/dist/mutative.cjs.development.js:458` |
| `finalizePatches` | 0.01% | 1 |  | `node_modules/mutative-130/dist/mutative.cjs.development.js:466` |

## Key Observations

- **Proxy 相关操作:** 33.64% of CPU time
  - 主要函数: set, get, getProxyDraft, getDescriptor, getPrototypeOf
- **Array 操作:** 0.00% of CPU time
  - 主要函数: testUnshift
- **Native 函数:** 31.63% of CPU time

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