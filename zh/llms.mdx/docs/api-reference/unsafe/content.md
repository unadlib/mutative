# unsafe() (/zh/docs/api-reference/unsafe)

在严格模式下读取未创建草稿的值。

[严格模式](/zh/docs/advanced-guides/strict-mode)下，读取 `Date`、未标记的类实例或被 `mark` 标为可变的值等不可创建草稿的对象会抛错。`unsafe(callback)` 在允许此类读取的环境中执行回调，并返回回调结果。

```ts
unsafe<T>(callback: () => T): T
```

## 用法 [#usage]

```ts
import { create, unsafe } from 'mutative';

const baseState = {
  createdAt: new Date(Date.UTC(2020, 0, 1)),
  updatedAt: new Date(Date.UTC(2020, 0, 1)),
};

const state = create(
  baseState,
  (draft) => {
    // Reading a Date from a draft throws in strict mode:
    expect(() => draft.createdAt.getTime()).toThrow();

    const year = unsafe(() => draft.createdAt.getUTCFullYear());
    expect(year).toBe(2020);

    // Assigning a value is no read and needs no unsafe().
    draft.updatedAt = new Date(Date.UTC(2021, 0, 1));
  },
  {
    strict: true,
  }
);

expect(state.updatedAt.getUTCFullYear()).toBe(2021);
expect(baseState.updatedAt.getUTCFullYear()).toBe(2020);
```

严格模式要求显式读取，因为 Mutative 不会复制这些值。草稿与基础状态共享它们，`draft.createdAt.setFullYear(2000)` 等修改也会改变基础状态，下一个状态仍持有同一对象。请像上例替换 `updatedAt` 一样替换值，或将其类[标记](/zh/docs/advanced-guides/mark)为 `immutable`，让 Mutative 创建草稿并复制。

* 回调返回前，`unsafe()` 允许所有 producer 进行此类读取。嵌套调用不会提前结束外层调用的访问权限。
* 非严格模式下，它仅执行回调。
* 在 `unsafe()` 内读取的可创建草稿值仍是草稿，对其修改会照常记录。
