# 常见陷阱 (/zh/docs/advanced-guides/pitfalls)

避免草稿、返回值、未创建草稿的值及补丁中的常见错误。

大多数更新函数都是普通 JavaScript，但草稿是仅在更新期间有效的代理，Mutative 也只复制它为之创建草稿的值。下面介绍由此产生的常见错误。

## 重新赋值草稿参数 [#reassigning-the-draft-parameter]

给 `draft` 参数重新赋值只会改变局部变量。要替换整个状态，应返回新状态：

```ts
import { create } from 'mutative';

const baseState = { count: 1 };

const unchanged = create(baseState, (draft) => {
  // This only changes the local variable.
  draft = { count: 0 };
});
expect(unchanged).toBe(baseState);

const replaced = create(baseState, () => ({ count: 0 }));
expect(replaced).toEqual({ count: 0 });
```

## 修改草稿的同时返回其他值 [#changing-the-draft-and-returning-another-value]

更新函数必须在修改草稿和返回新状态之间二选一，否则 Mutative 无法确定采用哪个结果，会抛错。返回 `undefined` 或草稿本身会保留草稿修改；要让下一个状态为 `undefined`，应返回 [`rawReturn(undefined)`](/zh/docs/api-reference/rawreturn)。注意箭头函数可能隐式返回赋值表达式或方法调用的结果：

```ts
import { create } from 'mutative';

const baseState = { list: [1] };

// `push()` returns the new length, which the recipe then returns:
// TypeScript rejects such a recipe, and at runtime it throws.
expect(() =>
  // @ts-expect-error
  create(baseState, (draft) => draft.list.push(2))
).toThrow();

// A block body returns nothing.
const state = create(baseState, (draft) => {
  draft.list.push(2);
});
expect(state.list).toEqual([1, 2]);
```

## 在更新结束后保留草稿 [#keeping-a-draft-after-the-recipe]

更新函数结束时，Mutative 会撤销其草稿。回调、闭包或其他状态持有的草稿之后再被读取时会抛错。应保留 [`current(draft)`](/zh/docs/api-reference/current)、原始对象或下一个状态。异步更新函数的草稿在 Promise 落定前有效；`create(base)` 的草稿则在 `finalize()` 返回前有效。

草稿也只属于创建它的 `create()` 调用，不要存入另一次调用的草稿中，详见[在草稿上调用 create()](/zh/docs/api-reference/create#create-on-a-draft)。

## 修改未创建草稿的值 [#changing-values-that-are-not-drafted]

Mutative 为普通对象、数组、Map 和 Set 创建草稿。类实例、日期、无原型对象等其他对象被草稿、基础状态和下一个状态共享，修改它们也会修改基础状态：

```ts
import { create } from 'mutative';

class Counter {
  count = 0;
}

const baseState = { counter: new Counter() };

const state = create(baseState, (draft) => {
  draft.counter.count += 1;
});

// The instance was changed in place, and the state was not copied.
expect(state).toBe(baseState);
expect(baseState.counter.count).toBe(1);
```

将这些类[标记](/zh/docs/advanced-guides/mark)为 `immutable`，让 Mutative 为实例创建草稿并复制；对无原型对象使用 [`markSimpleObject()`](/zh/docs/api-reference/marksimpleobject)；或直接替换值，而非修改它。[严格模式](/zh/docs/advanced-guides/strict-mode)会在开发环境报告这类读取。

## 在草稿中搜索基础状态的对象 [#searching-a-draft-for-objects-of-the-base-state]

基础状态中的对象经草稿读取后会成为代理，因此在草稿数组中搜索原始对象会找不到。可按 ID 搜索，或搜索 [`original(draft)`](/zh/docs/api-reference/original)；在新增、删除或移动元素前，其索引与草稿一致：

```ts
import { create, original } from 'mutative';

const baseState = { list: [{ id: 1 }, { id: 2 }] };
const item = baseState.list[1];

create(baseState, (draft) => {
  expect(draft.list.indexOf(item)).toBe(-1);
  expect(original(draft.list).indexOf(item)).toBe(1);
  expect(draft.list.findIndex((element) => element.id === 2)).toBe(1);
});
```

ES2025 的 [Set 方法](/zh/docs/extra-topics/faq#do-the-set-methods-such-as-union-and-issubsetof-work-on-set-drafts)也有相同情况，但 Set 草稿的 `has()` 和 `delete()` 可以接收原始对象。草稿不能作为 [Map 的键](/zh/docs/extra-topics/faq#can-a-draft-be-a-map-key)。

## 共享对象 [#shared-objects]

状态中的多条路径指向同一对象时，每条路径都有独立草稿，下一个状态为每条发生修改的路径持有一份副本。要保留共享关系，可将同一个草稿赋给其他路径，详见[共享引用](/zh/docs/extra-topics/shared-references)。

## 用 `rawReturn()` 包裹草稿 [#wrapping-drafts-in-rawreturn]

[`rawReturn()`](/zh/docs/api-reference/rawreturn) 不搜索返回值中的草稿，因此其中的草稿会以已撤销的状态留在最终结果中。只应包裹不含草稿的值，例如 `rawReturn(initialState)`，并在开发环境开启严格模式以报告此类问题。

## 修改补丁值 [#changing-patch-values]

补丁值引用下一个状态中的对象，开启自动冻结时也会被冻结。修改前应先复制补丁值，或使用会在应用前复制补丁值的 [`apply()`](/zh/docs/api-reference/apply)。

## 冻结基础状态 [#freezing-the-base-state]

开启[自动冻结](/zh/docs/advanced-guides/auto-freeze)后，Mutative 会冻结下一个状态与基础状态共享的对象。因此，之后原地修改基础状态也可能失败，即使修改的是更新函数没有碰过的部分。
