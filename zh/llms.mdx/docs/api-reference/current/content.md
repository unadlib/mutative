# current() (/zh/docs/api-reference/current)

获取草稿当前值的快照，返回不含代理的普通对象。

`current(draft)` 返回草稿当前值的快照：包含迄今修改的普通对象、数组、Map 和 Set，不含草稿代理。快照在更新结束后仍有效，可用于日志、比较、保存或搜索。

```ts
current<T>(draft: Draft<T>): T
```

## 用法 [#usage]

```ts
import { create, current } from 'mutative';

const baseState = {
  foo: 'bar',
  list: [{ text: 'todo' }],
};

const state = create(baseState, (draft) => {
  draft.foo = 'foobar';
  draft.list.push({ text: 'learning' });

  const snapshot = current(draft.list);
  expect(snapshot).toEqual([{ text: 'todo' }, { text: 'learning' }]);

  draft.list.push({ text: 'shipping' });
  // Later changes do not reach the snapshot.
  expect(snapshot).toHaveLength(2);
});
```

* 快照与基础状态共享未修改对象。草稿未修改时，`current(draft)` 无需复制，直接返回原值，与 [`original(draft)`](/zh/docs/api-reference/original) 一致。
* 每次调用都会复制已修改草稿及其已修改的后代，因此会产生新对象。连续读取应复用快照，避免在循环中反复调用。
* 后续草稿修改不会改变快照，但无法创建草稿的共享对象（如未标记的类实例）例外。
* 即使开启 `enableAutoFreeze`，快照也不会被冻结。
* 对基础状态或最终状态等非草稿调用会抛错，可用 [`isDraft()`](/zh/docs/api-reference/isdraft) 检查。

## 搜索大数组 [#searching-a-large-array]

通过草稿读取的每个对象都会创建独立草稿，所以 `draft.list.find()` 会为每个访问元素付出草稿开销。搜索 `current(draft.list)` 则读取普通值：数组未修改时返回原数组，修改后返回副本，其中已修改元素采用当前值，其他元素采用原始对象。即使增删或移动元素，快照索引也与草稿一致。请通过草稿修改匹配项；快照元素不是草稿，搜索回调只能读取它们。

```ts
import { create, current } from 'mutative';

const baseState = {
  list: Array.from({ length: 1000 }, (_, id) => ({ id, done: false })),
};

const state = create(baseState, (draft) => {
  draft.list.shift();
  const index = current(draft.list).findIndex((item) => item.id === 500);
  draft.list[index].done = true;
});

expect(state.list[499]).toEqual({ id: 500, done: true });
expect(state.list[0]).toBe(baseState.list[1]);
```

[严格模式](/zh/docs/advanced-guides/strict-mode)下，若更新函数留下 1,000 个或更多未修改草稿，开发构建会警告一次；大数组草稿搜索很容易触发。

<Callout type="idea">
  [`original(draft.list)`](/zh/docs/api-reference/original) 搜索的是基础状态，增删或移动元素后，其索引不再对应当前草稿。
</Callout>
