# 自动冻结 (/zh/docs/advanced-guides/auto-freeze)

使用 enableAutoFreeze 深度冻结下一个状态，阻止意外修改。

Mutative 默认不冻结下一个状态。开启 `enableAutoFreeze` 后，会通过 `Object.freeze()` 深度冻结状态，意外修改会失败，避免改变其他代码仍在使用的状态。

## 开启自动冻结 [#enable-auto-freeze]

```ts
import { create } from 'mutative';

const baseState = { user: { name: 'Ada' }, tags: ['a'] };

const state = create(
  baseState,
  (draft) => {
    draft.user.name = 'Grace';
  },
  {
    enableAutoFreeze: true,
  }
);

expect(Object.isFrozen(state)).toBe(true);
expect(Object.isFrozen(state.user)).toBe(true);
// The array that the next state shares with the base state is frozen too.
expect(state.tags).toBe(baseState.tags);
expect(Object.isFrozen(baseState.tags)).toBe(true);

// Writing to it throws in strict mode code, such as an ES module.
expect(() => {
  'use strict';
  (state.user as { name: string }).name = 'Linus';
}).toThrow(TypeError);
```

可通过 [`makeCreator()`](/zh/docs/api-reference/makecreator) 为整个应用设置默认值，也可将该选项传给 [`apply()`](/zh/docs/api-reference/apply)，冻结应用补丁后生成的状态。

## 冻结范围 [#what-is-frozen]

* 下一个状态中沿可枚举键可达的所有对象：包括已修改对象的副本、更新函数赋入的值，以及与基础状态共享的对象。共享对象在基础状态中也会被冻结。如果更新函数没有修改任何内容，则返回被冻结的基础状态本身。
* 类实例、日期和函数也像普通对象一样由 `Object.freeze()` 冻结。但 `Date` 仍可调用 `setFullYear()` 等修改方法，因为日期值并非对象属性。
* Map 和 Set 的 `set()`、`add()`、`delete()`、`clear()` 方法会抛错；Map 用作键的对象也会被冻结。

已冻结的对象及其内部值会被跳过，因此首次更新冻结状态后，后续更新只需冻结新复制或新增的对象。基础状态也可以预先冻结：修改时，Mutative 像处理其他对象一样复制冻结对象。

在 JavaScript 严格模式代码（包括 ES 模块和类）中，写入冻结对象会抛出 `TypeError`，其他情况下则不生效。冻结的 Map 和 Set 在两种情况下都会抛错。

## 开发环境检查 [#development-checks]

开发构建会拒绝包含循环引用的下一个状态，即对象通过其内部值直接或间接持有自身。Mutative 不支持此类结构，详见[共享引用](/zh/docs/extra-topics/shared-references)。生产构建跳过该检查。

开启自动冻结后，生产构建在[返回值](/zh/docs/api-reference/rawreturn)中搜索草稿时也会跳过冻结对象，所以返回之前已冻结的状态开销很小。开发构建仍会搜索，并在发现草稿时抛错。

## 成本与建议 [#cost-and-recommendation]

冻结需要访问所有尚未冻结的对象，每次更新都有开销，宽对象和大数组尤其明显。在[基准测试](/zh/docs/getting-started/performance)所选的大多数工作负载中，默认冻结的 Immer 开启自动冻结时比关闭时更慢；Mutative 默认关闭此功能。

<Callout type="idea">
  建议在开发环境开启自动冻结以发现意外修改，在生产环境关闭以提高性能：`makeCreator({ enableAutoFreeze: process.env.NODE_ENV !== 'production' })`。如果其他代码依赖冻结状态，则应在生产环境保留。
</Callout>

返回自定义浅拷贝函数的[标记](/zh/docs/advanced-guides/mark)不能与自动冻结一起使用。[`current()`](/zh/docs/api-reference/current) 始终返回未冻结的快照，即使开启了自动冻结。TypeScript 会将 `enableAutoFreeze: true` 时 `create()` 的返回类型标为属性只读的 `Immutable<State>`。
