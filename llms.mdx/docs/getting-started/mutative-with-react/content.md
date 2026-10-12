# Using Mutative with React (/docs/getting-started/mutative-with-react)

Update React state with create(), or with the use-mutative hooks.

React re-renders when a component's state is replaced with a new object, so state updates must not change the current state. `create()` produces that new state from changes to a draft, and the parts of the state that a recipe leaves unchanged keep their references, so memoized children and selectors skip them.

## With `useState` and `useReducer` [#with-usestate-and-usereducer]

`create()` needs no adapter: call it in a functional update of `useState`, or in a reducer for `useReducer`.

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

A recipe that changes nothing returns the current state itself, so React skips the re-render.

## use-mutative [#use-mutative]

[use-mutative](https://github.com/mutativejs/use-mutative) wraps these patterns in two hooks.



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

`useMutative()` works like `useState()`, and its setter also takes a recipe that changes a draft:

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

`useMutativeReducer()` works like `useReducer()`, and its reducer receives a draft of the state. A reducer changes the draft and returns nothing, or returns a new state; wrap a returned value that holds no drafts in [`rawReturn()`](/docs/api-reference/rawreturn) to skip searching it for drafts.

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

### Options and patches [#options-and-patches]

Both hooks take the [options of `create()`](/docs/api-reference/create#options) as their last argument. With `enablePatches`, they also return the patches and inverse patches of the last update:

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

The third argument of `useMutativeReducer()` is the optional initializer of `useReducer()`.

## Undo and redo [#undo-and-redo]

[use-travel](https://github.com/mutativejs/use-travel) keeps a history of the state from the patches of each update, with undo, redo and reset:

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

State libraries such as Zustand, Jotai and XState have Mutative integrations as well; see the [ecosystem](/docs/extra-topics/mutative-ecosystem).
