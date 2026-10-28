# 从 Mutative v1 迁移到 v2 (/zh/docs/advanced-guides/migration-v2)

相比 1.3.0，构建、补丁、数组、返回值、开发检查、类型和修复中可能影响现有代码的变化。

Mutative v2 保留 v1 API。以下列出自 v1.3.0 以来可能影响现有代码的变化。

## 构建输出与包入口 [#build-output-and-package-entries]

* **ES2018 输出**：所有构建目标从 ES2015 改为 ES2018，保留原生对象展开。支持 Proxy 但不支持 ES2018 的 Chrome 49–59、Firefox 18–54、Safari 10–11.0、Edge 12–18 等引擎，需要项目构建工具转译 Mutative。
* **打包工具**：ESM 入口在每个开发检查处比较 `process.env.NODE_ENV`，不再始终运行开发代码。定义 `NODE_ENV` 为 `production` 的生产打包会移除开发检查和警告，并抛出压缩错误，与 CommonJS 消费端一致。未定义 `NODE_ENV` 的 Node.js 目标打包（如 esbuild 的 `platform: 'node'`）现在会包含两份 CommonJS 构建；请定义该变量或将 Mutative 设为外部依赖。
* **Node.js ESM**：Node.js 中的 `import` 解析到重新导出 CommonJS 构建的模块，因此与 `require` 共享实例，且都遵循 `NODE_ENV`。此前 `import` 始终以独立实例运行开发 ESM 构建。
* **无打包工具**：`dist/mutative.esm.mjs` 和 `dist/mutative.esm.js` 加载时读取 `process.env.NODE_ENV`，直接通过 CDN URL 在 `<script type="module">` 或其他没有 `process` 的环境中加载会报 `process is not defined`。请改用 `dist/mutative.esm.production.min.mjs`，或 `unpkg`、`jsdelivr` 字段指向的 UMD 构建。
* **生产错误**：生产构建抛出 `Minified Mutative error #<code>` 并附上[错误参考](/zh/docs/extra-topics/errors)链接，不再提供完整消息；`apply()`、`original()`、`rawReturn()` 也一样。开发构建保留完整消息。生产代码若匹配错误文本，需改为匹配错误码。

## 补丁 [#patches]

* **顺序**：嵌套草稿的补丁现在先于父级补丁，与 Immer 一致。例如 `const item = draft.list[0]; draft.list.length = 0; item.text = 'b'; draft.item = item;` 先生成 `list` 长度替换，再生成 `item` 添加。应用结果与此前一致；仅重复表达原索引处未变化草稿的冗余替换补丁不再生成。
* **值**：原本为草稿的补丁值现在引用下一个状态中的对象，不再深拷贝；开启 `enableAutoFreeze` 时一同冻结。`apply()` 仍会在应用前复制补丁值。修改补丁值前请先复制。
* **移动的草稿**：已修改草稿因排序、赋值或替换离开原键后，不再在旧路径下生成补丁，其值由父级补丁携带。v1 的这类补丁可能无法应用，例如原键被原始值替换后的逆向补丁。
* **Set 元素**：Set 同时增删元素时，已修改元素由 Set 的 `remove` 和 `add` 按值携带。v1 还会按修改后的位置生成元素内部补丁，重放时可能改错基础 Set 中的元素，或根本无法应用。只修改元素而不增删的 Set 仍按位置生成补丁。
* **用原始对象覆盖草稿**：将草稿的原始对象赋给持有它的键，现在像普通赋值一样记录。若草稿最初就从此键读取，恢复原值不生成补丁；若草稿由其他键移来，则生成该赋值的补丁。v1 对两种情况都错误生成对象键的 `remove`，第二种情况又遗漏数组元素补丁，导致重放时丢键或丢失元素更新。

## 数组 [#arrays]

* `shift`、`unshift`、`splice`、`reverse` 在普通数组草稿的副本上原生执行，`indexOf`、`lastIndexOf`、`includes` 原生搜索，详见[哪些数组方法原生执行](/zh/docs/extra-topics/faq#which-array-methods-run-natively-on-drafts)。数据数组的结果与 v1 一致，补丁可双向重放。数组索引上的访问器会读取为数据值，因此 getter 调用次数可能变化。
* 已修改数组的 `current()` 复制当前数组，不再逐元素通过草稿读取。原生方法移动的基础元素若含外层 `create()` 的草稿，会保持原样，与未移动元素原有行为一致。
* 大数组搜索可用 `current(draft.list)`，避免为每个访问元素创建草稿，再通过草稿修改匹配项，详见 [`current()`](/zh/docs/api-reference/current)。

## 返回值 [#returned-values]

* 开启 `enableAutoFreeze` 时，生产构建不再搜索返回值中的冻结对象（包括返回值本身）及其内部值，内部草稿会保持未解析。开发构建仍会搜索并在发现草稿时抛错，包括冻结对象内部尚未冻结的对象，v1 会替换其中草稿。不要将草稿放入冻结对象或其内部值。关闭自动冻结时，返回值搜索与 v1 一致。

## 开发构建 [#development-builds]

* 严格模式下，更新函数留下 1,000 个或更多未修改草稿时警告一次，例如大数组草稿搜索。
* 严格模式下，对不含草稿的值调用 `rawReturn()` 不再输出相互矛盾的警告。
* `create()` 接收草稿和更新函数时警告一次，因为它与 v1 一样为 `current(draft)` 快照创建草稿，详见[在草稿上调用 create()](/zh/docs/api-reference/create#create-on-a-draft)。
* `enablePatches: { pathAsArray: false }` 时，如果路径含非字符串 Map 键或 symbol 键，会抛错，因为字符串路径无法表示这些键：应用时会写入不同键（如 `'1'` 而非 `1`），或无法应用键下的修改。生产构建与 v1 一样仍生成这类补丁，symbol 键仍会导致 `TypeError`。这类键应保留数组路径。
* 开启 `enableAutoFreeze` 时，只对真正持有自身的对象报告循环引用。`draft.prev = original(draft)` 等持有原值的修改草稿，或通过其他路径连接共享对象的情况不再抛错；生产构建一直能够冻结这类状态。真正循环的错误消息会指出重复对象路径，可能比 v1 多一个键。
* 将草稿作为 Map 草稿 `set()` 的键（如 `draft.map.set(draft.key, value)`）会抛错。Map 键原样保留，草稿撤销后读取会失败。生产构建仍像 v1 一样保留这种键。应使用 `original(draft)`、`current(draft)` 或 ID。

## TypeScript [#typescript]

* 显式指定状态类型的异步更新，如 `create<State>(base, async (draft) => { … })`，现在返回 `Promise<State>`，柯里化 producer 也一样；v1 错误标为 `State`。状态类型为泛型参数，或本身包含 Promise（如 `object`、`unknown`）时，异步或可能返回 Promise 的更新函数仍像 v1 一样推断为状态类型；泛型代码应省略显式类型参数。
* `apply()` 接受 `enableAutoFreeze: true` 并返回 `Immutable<State>`，与 `apply<State, true>()` 一致；v1 拒绝该选项并将冻结结果标为可变。选项类型为 `boolean` 或可选 `true` 时返回 `State | Immutable<State>`。`mutable` 为 `boolean`、可选 `boolean` 或可选 `true` 时返回 `State | void`。
* 标注草稿类型并返回新状态的柯里化更新函数，如 `create((draft: State) => ({ ...draft, count: 0 }))`，现在生成返回 `State` 的 producer；异步时为 `Promise<State>`。v1 错误将它识别为手动草稿，导致无法调用。泛型中的 `create((draft: T) => { … })` 也修复了同一问题。
* 显式指定状态类型时，可能返回也可能不返回 Promise 的更新函数（如 `(draft: State) => void | Promise<void>`）现在返回 `State | Promise<State>`，也适用于 `number` 等原始状态、柯里化 producer 和 `makeCreator()`。v1 将其标为 `State`。

## 会改变结果的修复 [#fixes-that-change-results]

* 开启补丁时，Set 中每个被修改的元素都保留修改。v1 对非根 Set 的多个元素进行深层修改时，只保留其中一个。
* Set 接收未修改草稿时，保留原始对象，与状态其余部分一致，不再持有草稿的浅拷贝。
* Set 草稿被移到其他键、数组、Map、Set 或新对象中后，即使原位置被替换或删除，新位置仍保留其增删改结果；v1 保留原始元素。
* Set 子类草稿像 Map 一样修改子类实例副本，子类的 `add`、`has`、`delete` 和 `clear` 在更新期间生效，迭代顺序也与 Set 一致。v1 将变化元素放在独立映射中，到更新结束重建 Set 时才经过这些方法。与 v1 已要求 Map 子类 `set` 的行为一样，Set 子类 `add` 必须保存收到的原值：若复制草稿或包含草稿的对象，会在最终状态中留下读取即抛错的草稿。
* 对被 `delete`、`shift`、`unshift` 或缩短数组的 `splice` 删除的键赋 `undefined`，会重新添加该键；v1 留下空洞或保持缩短后的长度。
* 删除当前草稿不拥有的数组索引不产生变化，与 JavaScript 一致。v1 删除原数组中已缺失的索引可能创建 `undefined` 元素，越界时还会扩展长度。此项也修复 v2.0.0 的回归：删除本次更新中已移除的索引会再次扩展数组，而 v1 会保留缩短后的数组（[#212](https://github.com/unadlib/mutative/issues/212)）。
* 对自有数据属性赋值时，即使原型有同名 setter，也会设置该属性，与 JavaScript 一致。v1 会通过草稿调用 setter，对 `JSON.parse()` 产生的自有 `__proto__` 赋值还会抛错。标为 `immutable` 的类实例通过赋值复制自有属性，因此 setter 现在会在副本上触发，而非通过草稿触发，见[复制已标记的实例](/zh/docs/advanced-guides/mark#copying-marked-instances)。
* `mark` 返回 `mutable` 时，重新读取更新函数赋入或移入的值（包括 `current()`）会得到实际赋入值；v1 返回原值。
* 状态含带草稿的普通 Set 时，`current()` 返回快照，v1 会抛错。
* `current()` 会快照更新函数赋入且被标记为可创建草稿的对象（如类实例）及其内部草稿。v1 原样返回对象，后续草稿修改会泄漏到快照。
* 开启自动冻结时，Map 和 Set 实例本身也被冻结，添加属性或替换方法会失败；v1 只替换修改方法。后续更新跳过冻结的 Map/Set，不再遍历条目；持有自身的 Map/Set 在生产环境不再栈溢出。
* Map/Set 草稿的迭代器遵循内置行为：部分消费后再次迭代会从停下的位置继续，环境支持时也提供 `toArray()` 等辅助方法。v1 会从头迭代，且只有 Map 的 `keys()` 支持辅助方法。
* Map 值与条目迭代器、所有 Set 迭代器必须在草稿有效期内消费。更新完成、失败或手动草稿完成最终处理后，再产出新值会抛出 `TypeError`。惰性辅助方法遵循相同生命周期，耗尽的迭代器保持耗尽。Map 键不创建草稿，`keys()` 仍返回原生迭代器。
* `apply()` 复制补丁值的自有 symbol 键；自有 `__proto__` 保持数据属性。v1 丢弃 symbol 键，并把自有 `__proto__` 变成副本原型。
* `apply()` 拒绝对象或数组上以 `__proto__` 结尾的路径，与路径中间出现此键的处理一致。可转换属性键（如包装字符串）也在转换后检查。v1 在 `mutable: true` 时会赋值并替换对象原型。
* 补丁路径访问 Set 元素时，只接受 `1` 或 `'1'` 等索引，`__proto__` 等其他键会抛错。v1 会读取元素数组的任意属性，使 `__proto__` 路径能访问 `Array.prototype`。
* `apply()` 的 `mutable: true` 遇到替换根状态的补丁会抛错，因为无法原地替换根值。v1 忽略替换，却把后续补丁应用到替换值，导致原状态未变而补丁值被修改。
* `mark` 使对象可创建草稿时（如 `markSimpleObject` 下的普通对象），副本保留自有 `__proto__` 数据属性；v1 通过赋值替换了副本原型。
* 数组作为 Map 键时，补丁路径将它保留为单个路径段；v1 将数组展开到路径中，导致写入其他键。
* `apply()` 原样使用补丁路径中的 Map 键。v1 先转为字符串，无原型对象键会导致错误。
* 数组补丁记录 `0` 与 `-0` 的变化；状态本就保留符号，但 v1 重放补丁会丢失。保持 `NaN` 的元素不再生成替换补丁。
* 稀疏数组补丁双向区分空洞和 `undefined`。先缩短再扩展（如 `draft.length = 1; draft.length = 3`）会生成同样的截短和扩展补丁，重新暴露的索引为空洞，逆向补丁恢复原元素。v1 的正向补丁保留已移除元素，逆向补丁留下空洞；还会将新增空洞，以及填洞后的逆向还原，错误变为 `undefined`。
* 严格模式下，嵌套 `unsafe()` 不再提前结束外层访问权限；v1 在内层返回后读取可变数据会抛错。
* 更新函数返回后发生错误（如同时修改草稿和返回其他值），也会撤销草稿并释放数组方法缓存，与更新函数抛错一致；v1 留下仍可用的草稿。这也覆盖检查返回 Proxy 或调用返回 Promise 的 `then` 时出错，并保留原始错误。
* `Symbol.isConcatSpreadable` 为 false 的数组草稿正确复制元素；v1 将整个数组作为唯一元素放入副本。
