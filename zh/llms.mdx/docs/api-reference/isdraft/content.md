# isDraft() (/zh/docs/api-reference/isdraft)

检查一个值是否为草稿。

`isDraft(value)` 对当前或其他更新函数的草稿返回 `true`，对其他值返回 `false`，包括基础状态、最终状态和更新函数赋入的值。

```ts
isDraft(value: any): boolean
```

## 用法 [#usage]

```ts
import { create, isDraft } from 'mutative';

const baseState = {
  date: new Date(),
  list: [{ text: 'todo' }],
};

const state = create(baseState, (draft) => {
  expect(isDraft(draft)).toBe(true);
  expect(isDraft(draft.list)).toBe(true);
  // A Date is not drafted.
  expect(isDraft(draft.date)).toBe(false);
});

expect(isDraft(state)).toBe(false);
expect(isDraft(baseState)).toBe(false);
```

可用于同时接收草稿与普通值的辅助函数：对草稿原地修改，对其他值调用 `create()`，见[在草稿上调用 create()](/zh/docs/api-reference/create#create-on-a-draft)。[`current()`](/zh/docs/api-reference/current) 和 [`original()`](/zh/docs/api-reference/original) 对非草稿会抛错。

`isDraft()` 需要读取传入值，因此对 producer 结束后已撤销的草稿调用时，也会像其他读取一样抛错。
