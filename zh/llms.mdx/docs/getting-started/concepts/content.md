# 核心概念 (/zh/docs/getting-started/concepts)

理解 Mutative 的草稿、最终处理、结构共享、补丁和标记。

Mutative 基于 `Proxy`。更新函数修改状态的草稿，Mutative 记录发生变化的部分，再据此生成下一个状态，并共享所有未变化的部分。补丁用于描述变化，标记用于决定哪些值可以创建草稿。

## 基本流程 [#base-workflow]

<img alt="Mutative 工作流程" src="__img0" />

* 当前状态是基础状态（base state），始终保持不变。
* 更新函数在草稿（draft）上修改数据。读取对象时，Mutative 为其创建草稿（图中虚线）；修改对象时，再复制该对象（图中红色部分）。
* 下一个状态包含已修改对象的副本，其余对象与基础状态共享。

```ts
import { create, isDraft } from 'mutative';

const baseState = {
  a0: {
    b0: {},
  },
  a1: {
    b1: {},
    b2: {
      c0: 0,
    },
  },
  a2: {},
};

const nextState = create(baseState, (draft) => {
  const { a0 } = draft;
  // Reading a draftable value through a draft gives a draft of it.
  expect(isDraft(a0)).toBe(true);
  draft.a1.b2.c0 = 1;
});

expect(nextState).not.toBe(baseState);
// Drafted but not changed: shared with the base state.
expect(nextState.a0).toBe(baseState.a0);
// Never read: shared with the base state.
expect(nextState.a2).toBe(baseState.a2);
// Changed, and every object on the path to the change: copied.
expect(nextState.a1).not.toBe(baseState.a1);
expect(nextState.a1.b2).not.toBe(baseState.a1.b2);
expect(nextState.a1.b1).toBe(baseState.a1.b1);
expect(nextState.a1.b2.c0).toBe(1);
```

## 草稿 [#drafts]

草稿是状态中某个值的 `Proxy`，行为与该值一致：更新函数可以读取、赋值、删除属性，或调用数组的 `push()`、Map 的 `set()` 等方法。Mutative 按需创建草稿：

* 通过草稿读取可创建草稿的值时，首次读取才为它创建草稿。普通对象、数组、Map 和 Set 均可创建草稿，通过[标记](/zh/docs/advanced-guides/mark)指定的类实例等值也可以，详见 [`isDraftable()`](/zh/docs/api-reference/isdraftable)。原始值、日期等其他值直接原样返回。
* 首次修改草稿时会浅拷贝原值，后续修改都写入同一副本。因此，无论更新函数修改多少次，每次更新最多复制每个对象一次。
* 更新函数赋入的新值不会自动变成草稿，下一个状态直接持有这些值。
* 通向同一对象的每条路径都有独立的草稿，即使多条路径引用同一对象也是如此，详见[共享引用](/zh/docs/extra-topics/shared-references)。

草稿的生命周期仅限于所属的 `create()` 调用。更新函数结束后，Mutative 会撤销草稿代理，之后再读取就会抛错。如需保留数据，请使用返回普通值快照的 [`current(draft)`](/zh/docs/api-reference/current)；可通过 [`isDraft()`](/zh/docs/api-reference/isdraft) 检查是否为草稿。

## 最终处理 [#finalization]

更新函数结束后，Mutative 对草稿进行最终处理：下一个状态采用已修改草稿的副本，并保留未修改草稿的原值，因此所有未变化的对象都与基础状态共享。如果更新函数没有做任何修改，就返回基础状态本身。开启[自动冻结](/zh/docs/advanced-guides/auto-freeze)后，Mutative 还会深度冻结下一个状态。

更新函数也可以直接返回新状态，而不修改草稿，详见[返回新状态](/zh/docs/api-reference/create#returning-a-new-state)。

## 补丁 [#patches]

开启 `enablePatches` 后，`create()` 还会返回描述更新内容的正向补丁，以及用于撤销的逆向补丁。每个补丁包含操作 `op`（`add`、`remove` 或 `replace`）、从根节点指向变化位置的 `path`，以及 `add` 和 `replace` 操作所需的新 `value`。[`apply()`](/zh/docs/api-reference/apply) 可将补丁应用到状态，例如在另一个状态副本上重放或撤销修改，详见[补丁](/zh/docs/advanced-guides/patches)。

## 标记 [#mark]

状态可能混合需要与不需要创建草稿的数据，例如类实例、缓存或来自其他库的值。`mark` 选项逐个决定：为值创建草稿、保持其可变，还是使用自定义函数复制。无需在对象本身添加标记。详见[标记数据结构](/zh/docs/advanced-guides/mark)。
