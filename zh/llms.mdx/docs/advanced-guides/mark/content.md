# 标记数据结构 (/zh/docs/advanced-guides/mark)

通过 mark 选项决定哪些值创建草稿、哪些保持可变，以及如何复制它们。

默认情况下，Mutative 为普通对象、数组、Map 和 Set 创建草稿，其他值保持原样：状态中的类实例、`Date` 或无原型对象会被草稿、基础状态和下一个状态共享。`mark` 选项可改变指定值的处理方式，无需修改值或类定义。

## 标记函数 [#mark-functions]

标记函数接收更新函数从草稿读取的每个值，以及 `{ mutable: 'mutable', immutable: 'immutable' }`。它可以返回：

* `'immutable'`：为值创建草稿，例如类实例。修改时 Mutative 会保留原型并复制它。
* `'mutable'`：不为值创建草稿。更新函数直接读取和修改原值及其内部值，下一个状态也与之共享。
* 一个返回浅拷贝的函数：使用该副本为值创建草稿。
* 不返回值：按默认方式处理。

```ts
import { create } from 'mutative';

class Todo {
  done = false;
  constructor(public text: string) {}
  toggle() {
    this.done = !this.done;
  }
}

const cache = { hits: 0 };

const baseState = {
  todos: [new Todo('learn'), new Todo('ship')],
  cache,
};

const state = create(
  baseState,
  (draft) => {
    draft.todos[0].toggle();
    draft.cache.hits += 1;
  },
  {
    mark: (target, { immutable, mutable }) => {
      if (target instanceof Todo) return immutable;
      if (target === cache) return mutable;
      return undefined;
    },
  }
);

// The changed instance is a copy of the same class.
expect(state.todos[0]).toBeInstanceOf(Todo);
expect(state.todos[0].done).toBe(true);
expect(baseState.todos[0].done).toBe(false);
expect(state.todos[1]).toBe(baseState.todos[1]);

// The mutable object was changed in place.
expect(state.cache).toBe(cache);
expect(cache.hits).toBe(1);
```

可传入标记函数列表组合使用，第一个返回值的函数决定处理方式，例如 `mark: [markSimpleObject, markTodos]`。[`markSimpleObject()`](/zh/docs/api-reference/marksimpleobject) 用于无原型对象和其他 realm 中的普通对象。

对同一状态的每次调用应使用相同标记。可用 [`makeCreator({ mark })`](/zh/docs/api-reference/makecreator) 设置默认值，[`apply()`](/zh/docs/api-reference/apply) 和 [`isDraftable()`](/zh/docs/api-reference/isdraftable) 也支持此选项。若基础状态本身是类实例，必须将它标为 `immutable`，否则 `create()` 会抛错。

## 补丁、自动冻结与严格模式 [#patches-auto-freeze-and-strict-mode]

* 标为 `immutable` 的值像普通对象一样支持补丁和自动冻结。对所有对象都返回 `'immutable'` 的标记（如 `() => 'immutable'`）也同样支持。
* 返回拷贝函数的标记不能与补丁或自动冻结组合，开发构建会报错；部分补丁也可能无法应用到这类值。
* [严格模式](/zh/docs/advanced-guides/strict-mode)下，从草稿读取标为 `mutable` 的值必须位于 [`unsafe()`](/zh/docs/api-reference/unsafe) 内，否则会像读取其他不可创建草稿的对象一样抛错。

## 自定义浅拷贝 [#custom-shallow-copies]

返回函数的标记会使用该函数返回的副本创建草稿，适用于默认复制方式无法处理的值，如 `Date`：

```ts
import { create } from 'mutative';

const baseState = { updatedAt: new Date(Date.UTC(2020, 0, 1)) };

const state = create(
  baseState,
  (draft) => {
    const updatedAt = draft.updatedAt;
    updatedAt.setUTCFullYear(2021);
    updatedAt.setUTCMonth(5);
  },
  {
    mark: (target) =>
      target instanceof Date ? () => new Date(target.getTime()) : undefined,
  }
);

expect(state.updatedAt.toISOString()).toBe('2021-06-01T00:00:00.000Z');
expect(baseState.updatedAt.getUTCFullYear()).toBe(2020);
```

首次读取这类值会直接返回副本，后续读取则返回副本的草稿。两种引用上的修改都会进入下一个状态，但 `Date` 等将数据存于内部槽或私有字段的对象，其方法只能在副本本身上调用。因此应像上例一样只读取一次，并通过该引用修改。若不使用标记，可赋入新的 `Date`。

## 复制已标记的实例 [#copying-marked-instances]

Mutative 复制被 `mark` 标为 `immutable` 的实例时，会保留其全部自有属性（包括不可枚举属性），并将自有访问器读取为值，类似 Immer 的 `setUseStrictShallowCopy('class_only')`。为了加快复制，可枚举、可写、可配置的自有属性通过赋值复制，而非定义属性，类似 Immer 的默认复制方式。因此，如果自有属性遮蔽了类上的 setter（例如子类字段覆盖基类访问器），复制时会触发副本上的 setter，可能修改副本与基础状态共享的对象；若遮蔽的是无 setter 的 getter 或只读属性，复制会抛错。请将这类值保存在类访问器中，或改用其他键。
