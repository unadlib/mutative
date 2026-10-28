# 从 Immer 迁移 (/zh/docs/advanced-guides/migration)

将 Immer API 替换为 Mutative，并检查冻结、补丁、类实例和异步更新的差异。

从 Immer 迁移到 Mutative 主要是替换 API 调用。两者都通过修改草稿生成新状态，并共享未修改的部分。[与 Immer 对比](/zh/docs/extra-topics/comparison-with-immer)列出了完整 API 对应关系和行为差异。

<Callout type="idea">
  [mutative-compat](https://github.com/exuanbo/mutative-compat) 使用 Immer API 封装 Mutative，可先快速切换，再逐步迁移具体调用。
</Callout>

## 迁移清单 [#checklist]

1. 将 `produce()` 替换为 `create()`，将 `produceWithPatches()` 替换为开启 `enablePatches: true` 的 `create()`，将 `applyPatches()` 替换为 `apply()`，将 `nothing` 替换为 `rawReturn(undefined)`。`current()`、`original()`、`isDraft()`、`isDraftable()`、`castDraft()` 和 `castImmutable()` 名称不变。
2. 移除 `enableMapSet()`、`enablePatches()` 和 `enableArrayMethods()` 调用：Mutative 内置支持 Map、Set 和补丁，并原生执行相关数组方法。
3. 确认是否需要冻结。Immer 默认冻结下一个状态，Mutative 默认不冻结。若代码依赖冻结状态（例如捕获意外修改），请设置 `enableAutoFreeze: true`。
4. 将 `setAutoFreeze()` 和 `new Immer()` 的全局配置替换为每次调用的选项，或通过 [`makeCreator()`](/zh/docs/api-reference/makecreator) 设置默认值。
5. 用 [`mark`](/zh/docs/advanced-guides/mark) 选项替换类上的 `[immerable] = true`。

## `produce()` → `create()` [#produce---create]

```ts
import { produce } from 'immer';

const baseState = [
  { title: 'Learn TypeScript', done: true },
  { title: 'Try Immer', done: false },
];

const nextState = produce(baseState, (draft) => {
  draft[1].done = true;
  draft.push({ title: 'Tweet about it', done: false });
});

expect(nextState[1].done).toBe(true);
expect(Object.isFrozen(nextState)).toBe(true);
```

使用 Mutative：

```ts
import { create } from 'mutative';

const baseState = [
  { title: 'Learn TypeScript', done: true },
  { title: 'Try Mutative', done: false },
];

const nextState = create(baseState, (draft) => {
  draft[1].done = true;
  draft.push({ title: 'Tweet about it', done: false });
});

expect(nextState[1].done).toBe(true);
expect(Object.isFrozen(nextState)).toBe(false);
```

Mutative 默认不冻结下一个状态，只有设置 `enableAutoFreeze` 才会冻结，这也是其更快的原因之一。要保留 Immer 的默认行为，可在每次调用时传入选项，或创建自带该配置的 `create()`：

```ts
import { makeCreator } from 'mutative';

const create = makeCreator({ enableAutoFreeze: true });

const nextState = create({ list: [1] }, (draft) => {
  draft.list.push(2);
});

expect(Object.isFrozen(nextState.list)).toBe(true);
```

两者的柯里化 producer 用法一致：`produce(recipe)` 替换为 `create(recipe)`，producer 会将其余参数传给更新函数，详见[柯里化](/zh/docs/advanced-guides/currying)。

## 补丁 [#patches]

```ts
import { applyPatches, enablePatches, produceWithPatches } from 'immer';

enablePatches();

const baseState = { info: { name: 'Michael', age: 33 } };

const [nextState, patches, inversePatches] = produceWithPatches(
  baseState,
  (draft) => {
    draft.info.age++;
  }
);

expect(applyPatches(baseState, patches)).toEqual(nextState);
expect(applyPatches(nextState, inversePatches)).toEqual(baseState);
```

使用 Mutative：

```ts
import { apply, create } from 'mutative';

const baseState = { info: { name: 'Michael', age: 33 } };

const [nextState, patches, inversePatches] = create(
  baseState,
  (draft) => {
    draft.info.age++;
  },
  { enablePatches: true }
);

expect(apply(baseState, patches)).toEqual(nextState);
expect(apply(nextState, inversePatches)).toEqual(baseState);
```

传给 `produce()` 的补丁监听器同样可改为开启此选项，再从 `create()` 结果读取补丁。两者在缩短数组和修改 Set 中对象时的补丁有所不同：Mutative 默认用 `replace` 修改 `length`；设置 `enablePatches: { arrayLengthAssignment: false }` 后，就会像 Immer 一样逐索引删除。详见对比中的[补丁](/zh/docs/extra-topics/comparison-with-immer#patches)。

## 返回 `undefined` [#return-undefined]

Immer 的 `nothing` 用于让更新函数返回 `undefined`：

```ts
import { nothing, produce } from 'immer';

const baseState: { count: number } | undefined = { count: 1 };

const nextState = produce(baseState, () => nothing);

expect(nextState).toBeUndefined();
```

Mutative 则返回 `rawReturn(undefined)`：

```ts
import { create, rawReturn } from 'mutative';

const baseState: { count: number } | undefined = { count: 1 };

const nextState = create(baseState, () => rawReturn(undefined));

expect(nextState).toBeUndefined();
```

## 手动草稿 [#manual-drafts]

`createDraft()` 和 `finishDraft()` 可替换为不带更新函数的一次 `create()` 调用，它同时返回草稿和最终处理函数：

```ts
import { createDraft, finishDraft } from 'immer';

const baseState = { count: 1 };

const draft = createDraft(baseState);
draft.count += 1;
const nextState = finishDraft(draft);

expect(nextState).toEqual({ count: 2 });
```

使用 Mutative：

```ts
import { create } from 'mutative';

const baseState = { count: 1 };

const [draft, finalize] = create(baseState);
draft.count += 1;
const nextState = finalize();

expect(nextState).toEqual({ count: 2 });
```

## 类实例 [#classes]

Immer 为带 `[immerable] = true` 的类实例创建草稿。Mutative 无需修改类，而是通过 `mark` 函数将实例标为 `immutable`：

```ts
import { create } from 'mutative';

class Clock {
  constructor(
    public hour: number,
    public minute: number
  ) {}
}

const clock = new Clock(12, 10);

const nextClock = create(
  clock,
  (draft) => {
    draft.minute += 1;
  },
  {
    mark: (target, { immutable }) =>
      target instanceof Clock ? immutable : undefined,
  }
);

expect(nextClock).toBeInstanceOf(Clock);
expect(nextClock.minute).toBe(11);
expect(clock.minute).toBe(10);
```

对这类状态的每次 `create()` 和 `apply()` 调用都应传入相同 `mark`，例如通过 `makeCreator({ mark })` 设置。详见[标记数据结构](/zh/docs/advanced-guides/mark)。

## 异步更新函数 [#async-recipes]

Immer 11 不支持异步更新函数：若在首次 `await` 前修改草稿，会因为返回的 Promise 被视为新值而抛错；若之后再修改，则会访问已撤销的草稿。Mutative 的 `create()` 返回下一个状态的 Promise，在其落定前草稿始终可用：

```ts
import { create } from 'mutative';

const baseState = { user: { name: '' } };

const nextState = await create(baseState, async (draft) => {
  draft.user.name = await Promise.resolve('Ada');
});

expect(nextState.user.name).toBe('Ada');
```

## TypeScript [#typescript]

两者均导出 `Draft<T>`、`Immutable<T>` 和 `Patch`；Mutative 额外提供补丁列表类型 `Patches` 和 `castMutable()`。Mutative 根据选项推断 `create()` 的返回类型，例如开启 `enablePatches: true` 时返回包含补丁的元组，详见 [TypeScript](/zh/docs/advanced-guides/typescript)。
