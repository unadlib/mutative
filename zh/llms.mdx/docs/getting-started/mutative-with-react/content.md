# 在 React 中使用 Mutative (/zh/docs/getting-started/mutative-with-react)

使用 create() 或 use-mutative 的 Hook 更新 React 状态。

当组件状态被新对象替换时，React 会重新渲染，因此更新不能修改当前状态。`create()` 根据草稿上的修改生成新状态，未变化的部分保留原引用，使经过记忆化处理的子组件和选择器可以跳过这些部分。

## 配合 `useState` 和 `useReducer` [#with-usestate-and-usereducer]

`create()` 无需适配器：可在 `useState` 的函数式更新中调用，也可在 `useReducer` 的 reducer 中调用。

```tsx
import { useReducer, useState } from 'react';
import { create } from 'mutative';

type Todo = { text: string; done: boolean };

export function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([{ text: 'Learn React', done: false }]);

  const toggle = (index: number) =>
    setTodos((current) =>
      create(current, (draft) => {
        draft[index].done = !draft[index].done;
      })
    );

  return (
    <ul>
      {todos.map((todo, index) => (
        <li key={index} onClick={() => toggle(index)}>
          {todo.done ? '✓' : '○'} {todo.text}
        </li>
      ))}
    </ul>
  );
}

type Action = { type: 'add'; text: string } | { type: 'remove'; index: number };

function reducer(state: Todo[], action: Action) {
  return create(state, (draft) => {
    switch (action.type) {
      case 'add':
        draft.push({ text: action.text, done: false });
        break;
      case 'remove':
        draft.splice(action.index, 1);
        break;
    }
  });
}

export function useTodos(initialTodos: Todo[]) {
  return useReducer(reducer, initialTodos);
}
```

如果更新函数没有修改任何内容，就返回当前状态本身，React 会跳过重新渲染。

## use-mutative [#use-mutative]

[use-mutative](https://github.com/mutativejs/use-mutative) 将上述模式封装为两个 Hook。



```bash
npm install mutative use-mutative
```

```bash
pnpm add mutative use-mutative
```

```bash
yarn add mutative use-mutative
```

```bash
bun add mutative use-mutative
```

### `useMutative()` [#usemutative]

`useMutative()` 的用法类似 `useState()`，其 setter 还可以接收修改草稿的更新函数：

```tsx
import { useMutative } from 'use-mutative';

export function App() {
  const [state, setState] = useMutative({
    foo: 'bar',
    list: [{ text: 'todo' }],
  });

  return (
    <>
      <button
        onClick={() => {
          // Change a draft of the state.
          setState((draft) => {
            draft.foo = `${draft.foo} 2`;
            draft.list.push({ text: 'todo 2' });
          });
        }}
      >
        Update
      </button>
      <button
        onClick={() => {
          // Or replace the state.
          setState({ foo: 'bar 2', list: [{ text: 'todo 2' }] });
        }}
      >
        Replace
      </button>
      <pre>{JSON.stringify(state, null, 2)}</pre>
    </>
  );
}
```

### `useMutativeReducer()` [#usemutativereducer]

`useMutativeReducer()` 的用法类似 `useReducer()`，但 reducer 接收到的是状态草稿。reducer 可以修改草稿并不返回任何值，或直接返回新状态。如果返回值不包含草稿，可用 [`rawReturn()`](/zh/docs/api-reference/rawreturn) 包裹，跳过对其中草稿的搜索。

```tsx
import { rawReturn, type Draft } from 'mutative';
import { useMutativeReducer } from 'use-mutative';

const initialState = { count: 0 };

type Action = { type: 'reset' | 'increment' | 'decrement' };

function reducer(draft: Draft<typeof initialState>, action: Action) {
  switch (action.type) {
    case 'reset':
      return rawReturn(initialState);
    case 'increment':
      draft.count += 1;
      return;
    case 'decrement':
      draft.count -= 1;
      return;
  }
}

export function Counter() {
  const [state, dispatch] = useMutativeReducer(reducer, initialState);

  return (
    <div>
      Count: {state.count}
      <button onClick={() => dispatch({ type: 'increment' })}>Increment</button>
      <button onClick={() => dispatch({ type: 'decrement' })}>Decrement</button>
      <button onClick={() => dispatch({ type: 'reset' })}>Reset</button>
    </div>
  );
}
```

### 选项与补丁 [#options-and-patches]

两个 Hook 都将 [`create()` 的选项](/zh/docs/api-reference/create#options)作为最后一个参数。开启 `enablePatches` 后，还会返回最近一次更新的正向补丁和逆向补丁：

```tsx
const [state, setState, patches, inversePatches] = useMutative(initialState, {
  enablePatches: true,
});

const [state, dispatch, patches, inversePatches] = useMutativeReducer(
  reducer,
  initialState,
  undefined,
  { enablePatches: true }
);
```

`useMutativeReducer()` 的第三个参数是 `useReducer()` 的可选初始化函数。

## 撤销与重做 [#undo-and-redo]

[use-travel](https://github.com/mutativejs/use-travel) 通过每次更新的补丁维护状态历史，支持撤销、重做和重置：

```tsx
import { useTravel } from 'use-travel';

export function Counter() {
  const [state, setState, controls] = useTravel({ count: 0 });

  return (
    <div>
      <strong>{state.count}</strong>
      <button
        onClick={() =>
          setState((draft) => {
            draft.count += 1;
          })
        }
      >
        Increment
      </button>
      <button onClick={() => controls.back()} disabled={!controls.canUndo}>
        Undo
      </button>
      <button onClick={() => controls.forward()} disabled={!controls.canRedo}>
        Redo
      </button>
    </div>
  );
}
```

Zustand、Jotai、XState 等状态库也有 Mutative 集成，详见[生态系统](/zh/docs/extra-topics/mutative-ecosystem)。
