# 常见问题 (/zh/docs/extra-topics/faq)

关于 Mutative 性能、从 Immer 迁移、数组、Map 和 Set 的常见问题。

其他问题可在 [GitHub Discussions](https://github.com/unadlib/mutative/discussions) 讨论；发现缺陷请提交 [issue](https://github.com/unadlib/mutative/issues)。

## 问答 [#qa]

### Mutative 为什么性能较好？ [#why-does-mutative-have-such-good-performance]

无论更新函数修改多少次，Mutative 每次更新最多复制每个对象一次，只为读取的值创建草稿，只完成已修改草稿的最终处理，并在副本上原生移动数组元素，避免逐元素经过代理。它还默认不冻结下一个状态。测量结果见[性能](/zh/docs/getting-started/performance)。

### 已经使用 Immer，可以平滑迁移吗？ [#im-already-using-immer-can-i-migrate-smoothly-to-mutative]

可以。除非需要兼容 Internet Explorer，Mutative 支持几乎所有 Immer 功能，[迁移指南](/zh/docs/advanced-guides/migration)介绍了各 API 的替换方式。[与 Immer 对比](/zh/docs/extra-topics/comparison-with-immer)列出全部对应 API 和行为差异。

Mutative 和 Immer 都需要 `Proxy`。Android 上 React Native 的 JavaScriptCore 自 0.59 起支持，Hermes 自 0.64 起支持，见 [Hermes 的 Proxy 支持](https://reactnative.dev/blog/2021/03/12/version-0.64#hermes-with-proxy-support)。

### 能与 Redux 集成吗？ [#can-mutative-be-integrated-with-redux]

可以。接收 action 参数的[producer](/zh/docs/advanced-guides/currying) 就是 reducer；更新函数也可以返回新状态，例如用 [`rawReturn()`](/zh/docs/api-reference/rawreturn) 返回初始状态。Redux Toolkit 的 `createSlice()`、`createReducer()` 使用 Immer，其[允许配置 produce() 的 RFC](https://github.com/reduxjs/redux-toolkit/pull/3074)已提出。

### 哪些数组方法在草稿上原生执行？ [#which-array-methods-run-natively-on-drafts]

`shift`、`unshift`、`splice`、`reverse` 在无空洞的普通数组副本上直接移动元素，包括值为 `undefined` 的元素；`indexOf`、`lastIndexOf`、`includes` 原生搜索当前数组；`sort`、`join` 在原始值数组上原生执行。移出的基础元素会作为草稿返回，补丁可双向重放，无变化调用保留状态。稀疏数组、数组子类、自有 `constructor` 或 `Symbol.isConcatSpreadable`、自定义 `mark` 下的数组、所有带回调的方法，以及 `at`、`slice`、`fill`、`copyWithin` 均走代理路径。可能执行用户代码的参数（如对象形式的 `fromIndex` 或 `splice` 索引）也在代理路径转换，以观察转换过程中对数组的修改，与原生方法一致。

快速路径面向数据数组：索引访问器会读取为数据值，其 getter 的调用次数、顺序、重入影响及返回对象身份，不保证与逐元素代理执行一致。自动冻结时，复制冻结、密封或不可扩展数组也可能读取 getter 两次。

优化搜索与代理路径结果一致，按读取时返回的元素身份比较。草稿、更新函数赋入的值、不可创建草稿的对象和原始值均可找到。基础状态对象读取时会变成草稿，所以无论之前是否读过都无法按原始对象找到，除非更新函数重新赋入或插入它且不在原索引。搜索基础状态可用 [`original()`](/zh/docs/api-reference/original)，如 `original(draft.list).indexOf(item)`。搜索不会读取传入查找值的属性。

严格模式下，位于 [`unsafe()`](/zh/docs/api-reference/unsafe) 外且可能含对象的数组走代理路径，读取不可创建草稿元素时照常失败；仅通过 `typeof` 确认的原始值数组保留原生路径。原生路径移动和比较元素时不检查内部结构，而代理路径检查每个读取元素。因此，元素本身若是 Proxy，其内部方法可能被调用更少，但不会更多或在额外时机调用。例如搜索跳过一个已撤销 Proxy 元素时，不会因此抛错。

这些方法移出或移动的可创建草稿基础元素，会在暴露前转换为草稿。`forEach`、`map`、`filter`、`find` 等带回调方法走代理，以便回调观察所有修改并修改元素。大数组只读扫描可使用 [`current()`](/zh/docs/api-reference/current)。

### 遍历 Map 草稿时可以修改它吗？ [#can-a-recipe-change-a-map-draft-while-iterating-over-it]

可以。删除当前条目、修改其他条目的值，与 Map 一致；Set 草稿也按 Set 方式迭代。但若 Map 草稿在首次修改或读取对象值之前开始迭代，它遍历的是基础 Map。此后删除的条目仍会被访问，值为 `undefined`；新增条目不会被访问。需要边遍历边删除其他条目时，可遍历 `Array.from(draft.keys())`，并跳过 `draft.has()` 为 false 的键。

### Set 草稿支持 `union()`、`isSubsetOf()` 等方法吗？ [#do-the-set-methods-such-as-union-and-issubsetof-work-on-set-drafts]

支持，但按草稿迭代返回的元素比较。基础状态对象在这里是草稿，因此无法与原始对象匹配，尽管 `has()` 接受原始对象。若需与基础状态对象比较，可在 `current(draft)` 上调用（未修改对象保留身份），在 `original(draft)` 上比较基础状态，或按 ID 比较，如 `[...draft].filter((item) => ids.has(item.id))`。此规则适用于 `union()`、`intersection()`、`difference()`、`symmetricDifference()`、`isSubsetOf()`、`isSupersetOf()`、`isDisjointFrom()`。

### 草稿可以作为 Map 的键吗？ [#can-a-draft-be-a-map-key]

不可以。Map 键原样保留，producer 结束时草稿被撤销，所以 Map 和引用该键的补丁都会持有已撤销草稿，读取属性会抛错。应改用 `original(draft)`、`current(draft)` 或 ID。开发构建会拒绝将草稿作为 Map 草稿 `set()` 的键。

### 支持共享引用吗？ [#does-mutative-support-shared-references]

支持，但**通向共享对象的每条路径都有独立草稿**，一条路径的修改不会自动反映到其他路径。要在结果中保留共享关系，必须显式赋值，例如 `draft.b = draft.a`。详见[共享引用](/zh/docs/extra-topics/shared-references)。

### 更新结束后可以保留草稿吗？ [#can-i-keep-a-draft-after-the-recipe-ends]

不可以。`create()` 的更新函数结束（包括失败）时会撤销草稿，之后读取会抛错。请保留 [`current(draft)`](/zh/docs/api-reference/current) 的普通值快照或最终状态。[手动 create(base)](/zh/docs/advanced-guides/currying#drafts-that-you-finalize-later) 的草稿在 `finalize()` 返回前有效，异步更新函数的草稿在 Promise 落定前有效。
