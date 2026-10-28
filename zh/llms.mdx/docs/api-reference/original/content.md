# original() (/zh/docs/api-reference/original)

获取创建草稿时的原值，不包含更新函数的修改。

`original(draft)` 返回创建该草稿时的值，即基础状态中的对象，不包含本次更新的修改。

```ts
original<T>(draft: T): T
```

## 用法 [#usage]

```ts
import { create, original } from 'mutative';

const baseState = {
  foo: 'bar',
  list: [{ text: 'todo' }],
};

const state = create(baseState, (draft) => {
  draft.foo = 'foobar';
  draft.list.push({ text: 'learning' });

  expect(original(draft.list)).toEqual([{ text: 'todo' }]);
  expect(original(draft.list)).toBe(baseState.list);
  expect(original(draft.list)).not.toBe(draft.list);
});
```

可用它比较草稿与原值，或在不创建草稿的情况下读取基础状态，因为原值不含代理。

* 返回的是基础状态对象本身，切勿修改。
* 对非草稿会抛错，包括基础状态、最终状态，以及更新函数赋入但未被创建草稿的值。可用 [`isDraft()`](/zh/docs/api-reference/isdraft) 检查。
* 基础状态中的对象经草稿读取后会成为代理，在草稿数组中搜索原对象会找不到。可使用 `original(draft.list).indexOf(item)`。

`original()` 反映修改前的状态，所以增删或移动元素后，查到的索引不再对应当前草稿。搜索当前草稿数组请使用 [`current()`](/zh/docs/api-reference/current#searching-a-large-array)。
