# create() (/zh/docs/api-reference/create)

根据更新函数对基础状态草稿的修改，生成下一个状态。

`create()` 为基础状态创建草稿，运行修改草稿的更新函数，并返回下一个状态。未修改的部分与基础状态共享，基础状态本身保持不变。

```ts
import { create } from 'mutative';

const baseState = {
  foo: 'bar',
  list: [{ text: 'todo' }],
};

const state = create(baseState, (draft) => {
  draft.foo = 'foobar';
  draft.list.push({ text: 'learning' });
});

expect(state).toEqual({
  foo: 'foobar',
  list: [{ text: 'todo' }, { text: 'learning' }],
});
expect(state.list[0]).toBe(baseState.list[0]);
expect(baseState.foo).toBe('bar');
```

## 函数签名 [#signatures]

```ts
create(base, recipe, options?) // the next state
create(base, recipe, { enablePatches: true }) // [nextState, patches, inversePatches]
create(recipe, options?) // a producer: (base, ...args) => the next state
create(base, options?) // [draft, finalize]
```

* `base` 是要创建草稿的状态：普通对象、数组、`Map`、`Set`，或通过 [`mark`](#mark) 变为可创建草稿的值（如类实例）。日期和未标记的类实例等其他对象会导致错误。传入更新函数时，原始值或 `null` 基础状态会原样传给更新函数，其返回值作为下一个状态。
* `recipe` 接收草稿；在 producer 中还会接收其余参数。它可以修改草稿且不返回值，或返回[新状态](#returning-a-new-state)，也可以是[异步函数](#async-recipes)。
* `options` 见[下文](#options)，可通过 [`makeCreator()`](/zh/docs/api-reference/makecreator) 设置默认值。

`create()` 返回下一个状态；若未发生修改，则返回基础状态本身。开启 `enablePatches` 后返回 `[nextState, patches, inversePatches]`：正向补丁将基础状态转为下一个状态，逆向补丁将其还原。异步更新函数则返回对应结果的 Promise。

## 选项 [#options]

<a id="createstate-fn-options---options" />

| 选项                                      | 类型                                                                                                                       | 默认值     |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------- |
| [`strict`](#strict)                     | `boolean`                                                                                                                | `false` |
| [`enablePatches`](#enablepatches)       | `boolean \| { pathAsArray?: boolean; arrayLengthAssignment?: boolean }`                                                  | `false` |
| [`enableAutoFreeze`](#enableautofreeze) | `boolean`                                                                                                                | `false` |
| [`mark`](#mark)                         | `Mark \| Mark[]`，其中 `Mark` 为 `(target, { mutable, immutable }) => 'mutable' \| 'immutable' \| (() => copy) \| undefined` | 无       |

### strict [#strict]

[严格模式](/zh/docs/advanced-guides/strict-mode)下，从草稿读取不可创建草稿的对象（如 `Date` 或未标记的类实例），或被 `mark` 标为可变的值时，必须位于 [`unsafe()`](/zh/docs/api-reference/unsafe) 内，否则抛错。通过 [`rawReturn()`](/zh/docs/api-reference/rawreturn) 返回的值仍会被搜索，开发构建发现其中有草稿时会警告。如果更新函数留下 1,000 个或更多未修改草稿，开发构建也会警告一次，大数组草稿搜索就容易触发。无需创建草稿的搜索方式见 [`current()`](/zh/docs/api-reference/current#searching-a-large-array)。

严格模式检查更新函数读取的每个值，建议开发时开启、生产时关闭，例如 `strict: process.env.NODE_ENV !== 'production'`。

### enablePatches [#enablepatches]

设为 `true` 后，`create()` 返回 `[nextState, patches, inversePatches]`，详见[补丁](/zh/docs/advanced-guides/patches)。也可传对象配置补丁格式：

* `pathAsArray` 默认为 `true`：路径为键数组，如 `['list', 0]`。设为 `false` 时使用 JSON Pointer 字符串，如 `'/list/0'`。字符串路径不能表示非字符串 Map 键或 symbol 键，例如 `draft.set(1, 'b')` 的补丁会写入键 `'1'`。这类键应保留数组路径，开发构建遇到无法表示的字符串路径会抛错。
* `arrayLengthAssignment` 默认为 `true`：缩短数组时生成修改 `length` 的 `replace`。设为 `false` 后，为每个移除的索引生成 `remove`，大数组的耗时会更高。

设置 `pathAsArray: false` 和 `arrayLengthAssignment: false` 后，对象和数组的补丁为 JSON Patch 操作（[RFC 6902](https://datatracker.ietf.org/doc/html/rfc6902)），另见[相关讨论](https://github.com/unadlib/mutative/issues/6)。

TypeScript 根据传给 `create()` 或 `makeCreator()` 的 `enablePatches` 类型确定结果：`true` 或对象返回元组，`boolean` 则返回状态或元组的联合类型。类型为 `{ enablePatches: true }` 但可能为 `undefined` 的选项（例如封装函数的可选参数），以及 `{ enablePatches?: true }`，仍会被推断为元组，但运行时关闭补丁只返回状态；此类场景应将标志类型写为 `boolean`。显式指定状态类型后，TypeScript 不再推断其他类型参数，需同时为 `enablePatches` 传入 `boolean`，例如 `create<State, false, boolean>(base, recipe, options)` 或 `create<State, [], false, boolean>(recipe, options)`。

### enableAutoFreeze [#enableautofreeze]

深度冻结下一个状态，包括与基础状态共享的部分。开发构建还会拒绝持有自身的对象，详见[自动冻结](/zh/docs/advanced-guides/auto-freeze)。

### mark [#mark]

标记决定如何为值创建草稿，详见[标记数据结构](/zh/docs/advanced-guides/mark)。它接收更新函数读取的每个值和 `{ mutable: 'mutable', immutable: 'immutable' }`，返回：

* `'immutable'`：允许创建草稿，如类实例；修改时会复制该值。
* `'mutable'`：不创建草稿，直接原地读取和修改该值及其内部值。
* 返回浅拷贝的函数：使用该副本处理草稿。必须关闭补丁和自动冻结，部分补丁也可能无法应用到这类值。
* `undefined`：使用默认处理方式。

传入标记数组时，第一个返回值的函数决定处理方式。若标记对所有对象都返回 `'immutable'`（如 `() => 'immutable'`），补丁和自动冻结仍正常工作。标为 `immutable` 的实例会复制全部自有属性，其中可枚举、可写、可配置的属性通过赋值复制。因此，自有属性遮蔽类 setter 时会触发该 setter，遮蔽无 setter 的 getter 或只读属性时会抛错，详见[复制已标记的实例](/zh/docs/advanced-guides/mark#copying-marked-instances)。

## 返回新状态 [#returning-a-new-state]

更新函数可以返回下一个状态，而不修改草稿：

```ts
import { create } from 'mutative';

const baseState = { todos: [{ text: 'todo', done: true }] };

const state = create(baseState, (draft) => ({
  todos: draft.todos.filter((todo) => !todo.done),
}));

expect(state).toEqual({ todos: [] });
```

* 返回 `undefined` 或草稿本身会保留草稿修改。要将状态设为 `undefined`，请返回 [`rawReturn(undefined)`](/zh/docs/api-reference/rawreturn)。
* 同时修改草稿并返回其他值会抛错。
* 返回未修改的子草稿（如 `draft.list`）时，其值成为下一个状态；返回已修改的子草稿会抛错。
* Mutative 搜索返回对象中的草稿并替换为最终值，因此可以返回 `{ ...draft, count: 0 }` 等含草稿的对象。[`rawReturn()`](/zh/docs/api-reference/rawreturn) 可为不含草稿的值跳过搜索；开发构建发现返回对象不含草稿时会给出使用建议。

## 异步更新函数 [#async-recipes]

更新函数可以是异步函数。此时 `create()` 返回结果的 Promise，在 Promise 落定前草稿保持可用。

```ts
import { create } from 'mutative';

const baseState = { items: ['a'] };

const state = await create(baseState, async (draft) => {
  const item = await Promise.resolve('b');
  draft.items.push(item);
});

expect(state.items).toEqual(['a', 'b']);
```

`create()` 只识别当前 JavaScript realm 的 Promise，因此来自其他 realm（如 `vm` 上下文或 iframe）的异步函数需要当前 realm 的包装：`create(baseState, async (draft) => { return await recipe(draft); })`。TypeScript 通常也推断为 Promise，但显式状态类型为泛型参数（如泛型函数中的 `create<T>(base, async (draft) => { … })`），或类型本身包含 Promise（如 `object`、`unknown`）时，会得到状态类型本身。泛型代码应省略显式类型参数：`create(base, async (draft) => { … })` 返回 `Promise<T>`，`create(async (draft: T) => { … })` 返回 `(base: T) => Promise<T>`。

## 柯里化 [#currying]

只传更新函数、不传基础状态时，`create()` 返回 producer，稍后接收基础状态，并将其余参数传给更新函数：

```ts
import { create } from 'mutative';

type Todo = { text: string; done: boolean };

const toggle = create((draft: Todo[], index: number) => {
  draft[index].done = !draft[index].done;
});

const todos: Todo[] = [{ text: 'learn', done: false }];

expect(toggle(todos, 0)).toEqual([{ text: 'learn', done: true }]);
```

只传基础状态、不传更新函数时，`create()` 返回草稿和 `finalize()`，其返回值与普通调用一致：

```ts
import { create } from 'mutative';

const baseState = { list: [{ text: 'todo' }] };

const [draft, finalize] = create(baseState, { enablePatches: true });
draft.list.push({ text: 'learning' });
const [state, patches] = finalize();

expect(state.list).toHaveLength(2);
expect(patches).toEqual([
  { op: 'add', path: ['list', 1], value: { text: 'learning' } },
]);
```

<Callout type="warn">
  `finalize()` 只能调用一次。如果它抛错（如开发构建拒绝补丁路径），草稿不会像更新函数失败时那样被撤销，而是仍可写入。再次调用可能返回包含已撤销草稿的状态，补丁也可能遗漏修改。应从基础状态重新创建草稿。
</Callout>

更多用法见[柯里化](/zh/docs/advanced-guides/currying)。

## 在草稿上调用 create() [#create-on-a-draft]

更新函数可以把草稿传给调用 `create()` 的辅助函数。与直接代理草稿的 Immer `produce` 不同，`create()` 会为当前状态快照 `current(draft)` 创建草稿，因此辅助函数未修改的值仍引用基础状态对象。将结果赋回外层草稿本身是安全的，但之后修改结果中的这些值会改变基础状态，因为外层草稿会原样返回赋入的值（[#160](https://github.com/unadlib/mutative/issues/160)）。开发构建在 `create()` 接收草稿和更新函数时会警告一次。

```ts
const state = create(baseState, (draft) => {
  draft.node = create(draft.node, (node) => {
    node.name = 'renamed';
  });
  // `draft.node` is now the helper's result, and `draft.node.metadata` is an
  // object of `baseState`: writing to it here would change `baseState`.
});
```

可让辅助函数直接修改草稿，仅对其他值调用 `create()`：

```ts
type Item = { name: string; metadata: { value: string } };

function rename(item: Item, name: string): Item {
  if (isDraft(item)) {
    item.name = name;
    return item;
  }
  return create(item, (draft) => {
    draft.name = name;
  });
}
```

接收到草稿时，`rename()` 返回草稿本身，外层更新函数通过外层代理继续修改，未变化的部分保留原引用。与 `create()` 不同，即使调用方丢弃返回值，它也已经修改了外层草稿。

如果不适合这种方式，可在辅助函数的更新函数内完成修改，或在调用前通过外层草稿修改。如果结果必须与基础状态完全隔离，可传入深拷贝，如 `create(structuredClone(current(draft)), recipe)`，代价是每次复制整个草稿、未修改值也获得新引用；`structuredClone` 还会将类实例变成普通对象，遇到函数则抛错。为捕获意外写入，可在开发环境为辅助函数开启 `enableAutoFreeze`，例如 `makeCreator({ enableAutoFreeze: process.env.NODE_ENV !== 'production' })`。它会同时冻结结果及其与基础状态共享的对象，使意外写入像 Immer 默认冻结时一样抛错。

草稿只属于创建它的 `create()` 调用，包括 `create(base)` 返回的手动草稿。不要存入其他调用的草稿，或赋入其中的对象：本次调用结束时它就会被撤销，另一次调用的结果可能保留无法读取的草稿，接收它的 Set 草稿也可能无法再通过 `has()` 或 `delete()` 找到它。请保存 `current(draft)`、原始对象或该调用的最终结果。

## 错误 [#errors]

无效基础状态、同时修改草稿和返回其他值等错误及其生产错误码，见[错误参考](/zh/docs/extra-topics/errors)。
