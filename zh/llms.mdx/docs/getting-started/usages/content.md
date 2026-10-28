# 常见用法 (/zh/docs/getting-started/usages)

使用 create() 对对象、数组、Map 和 Set 进行常见的不可变更新。

## 使用 `create()` 创建新状态 [#use-create-to-create-a-new-state]

```ts
import { create } from 'mutative';

const baseState = {
  foo: 'bar',
  list: [{ text: 'coding' }],
};

const state = create(baseState, (draft) => {
  draft.list.push({ text: 'learning' });
});

expect(state).not.toBe(baseState);
expect(state.list).not.toBe(baseState.list);
expect(state.list[0]).toBe(baseState.list[0]);
```

`create(baseState, recipe, options?)` 为基础状态创建草稿，并将它传给更新函数。更新函数使用普通 JavaScript 修改草稿，`create()` 返回下一个状态：复制已修改的对象，与基础状态共享其余对象。基础状态保持不变。选项及其他调用方式见 [`create()`](/zh/docs/api-reference/create)。

以下示例像普通 JavaScript 修改状态一样修改草稿。

## 对象 [#objects]

```ts
import { create } from 'mutative';

const baseState = {
  user: { name: 'Ada', address: { city: 'London' } },
  flags: { beta: true } as Record<string, boolean>,
};

const state = create(baseState, (draft) => {
  // Update a nested property.
  draft.user.address.city = 'Paris';
  // Add a property.
  draft.flags.darkMode = true;
  // Delete a property.
  delete draft.flags.beta;
});

expect(state).toEqual({
  user: { name: 'Ada', address: { city: 'Paris' } },
  flags: { darkMode: true },
});
```

## 数组 [#arrays]

```ts
import { create } from 'mutative';

type Todo = { id: number; text: string; done: boolean };

const baseState: Todo[] = [
  { id: 1, text: 'learn', done: false },
  { id: 2, text: 'build', done: false },
  { id: 3, text: 'ship', done: false },
];

const state = create(baseState, (draft) => {
  // Update the item with an id.
  const todo = draft.find((item) => item.id === 2);
  if (todo) todo.done = true;

  // Remove the item with an id.
  const index = draft.findIndex((item) => item.id === 1);
  if (index !== -1) draft.splice(index, 1);

  // Insert at the front, and add at the end.
  draft.unshift({ id: 0, text: 'plan', done: true });
  draft.push({ id: 4, text: 'celebrate', done: false });

  // Move the last item to the second position.
  const [moved] = draft.splice(draft.length - 1, 1);
  draft.splice(1, 0, moved);
});

expect(state.map((todo) => todo.id)).toEqual([0, 4, 2, 3]);
expect(state[2].done).toBe(true);
// Unchanged items keep their references.
expect(state[3]).toBe(baseState[2]);
```

要过滤数组，可将过滤结果赋给草稿。Mutative 会将新数组中的草稿替换为对应的最终值：

```ts
import { create } from 'mutative';

const baseState = { todos: [{ text: 'learn', done: true }, { text: 'ship', done: false }] };

const state = create(baseState, (draft) => {
  draft.todos = draft.todos.filter((todo) => !todo.done);
});

expect(state.todos).toEqual([{ text: 'ship', done: false }]);
expect(state.todos[0]).toBe(baseState.todos[1]);
```

`find()`、`filter()` 等带回调的方法通过草稿访问元素，所以每个被访问的元素都会变成草稿。对大数组进行只读搜索时，可改为搜索 [`current(draft)`](/zh/docs/api-reference/current#searching-a-large-array)。

## Map 和 Set [#maps-and-sets]

```ts
import { create } from 'mutative';

const baseState = {
  users: new Map([['ada', { name: 'Ada', age: 36 }]]),
  tags: new Set(['js']),
};

const state = create(baseState, (draft) => {
  // Update a value, and add and delete entries.
  draft.users.get('ada')!.age += 1;
  draft.users.set('grace', { name: 'Grace', age: 45 });
  draft.users.delete('ada');

  draft.tags.add('ts');
  draft.tags.delete('js');
});

expect([...state.users.keys()]).toEqual(['grace']);
expect([...state.tags]).toEqual(['ts']);
// The base state is unchanged.
expect(baseState.users.get('ada')!.age).toBe(36);
```

从 Map 或 Set 草稿读取的值也是草稿，而 Map 的键保持原样。常见问题中介绍了[遍历 Map 草稿](/zh/docs/extra-topics/faq#can-a-recipe-change-a-map-draft-while-iterating-over-it)、[将草稿作为 Map 键](/zh/docs/extra-topics/faq#can-a-draft-be-a-map-key)和 [ES2025 Set 方法](/zh/docs/extra-topics/faq#do-the-set-methods-such-as-union-and-issubsetof-work-on-set-drafts)。

## 返回新状态 [#returning-a-new-state]

更新函数可以像 reducer 一样，直接返回下一个状态，而不修改草稿：

```ts
import { create, rawReturn } from 'mutative';

const baseState = { count: 5, history: [1, 2, 3] };

const state = create(baseState, (draft) => ({ ...draft, count: 0 }));

expect(state).toEqual({ count: 0, history: [1, 2, 3] });
expect(state.history).toBe(baseState.history);

// `rawReturn()` returns a value as it is, and can return undefined.
const cleared = create(baseState as typeof baseState | undefined, () =>
  rawReturn(undefined)
);

expect(cleared).toBe(undefined);
```

更新函数必须在修改草稿和返回新值之间二选一，同时进行会抛错。详见[返回新状态](/zh/docs/api-reference/create#returning-a-new-state)。

## 补丁 [#patches]

```ts
import { apply, create } from 'mutative';

const baseState = { todos: ['learn'] };

const [state, patches, inversePatches] = create(
  baseState,
  (draft) => {
    draft.todos.push('ship');
  },
  { enablePatches: true }
);

expect(patches).toEqual([{ op: 'add', path: ['todos', 1], value: 'ship' }]);
expect(apply(state, inversePatches)).toEqual(baseState);
```

补丁格式及撤销、重做的实现见[补丁](/zh/docs/advanced-guides/patches)。
