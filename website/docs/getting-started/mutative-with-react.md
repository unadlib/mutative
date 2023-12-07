---
sidebar_position: 4
---

# Using Mutative with React

you can use Mutative with React by using the `useMutative()` hook.

## use-mutative Hook

A hook to use [mutative](https://github.com/unadlib/mutative) as a React hook to efficient update react state immutable with mutable way.

## Installation

```bash npm2yarn
npm install mutative use-mutative
```

## API

### useMutative

Provide you can create immutable state easily with mutable way.

```tsx
export function App() {
  const [state, setState] = useMutative(
    {
      foo: 'bar',
      list: [
        { text: 'todo' },
      ],
    },
  );
  <button
    onClick={() => {
      // set value with draft mutable
      setState((draft) => {
        draft.foo = `${draft.foo} 2`;
        draft.list.push({ text: 'todo 2' });
      });
    }}
  >
    click
  </button>
  <button
    onClick={() => {
      // also can override value directly
      setState({
        foo: 'bar 2',
        list: [{ text: 'todo 2' }],
      });
    }}
  >
    click
  </button>
}
```

### useMutativeReducer

Provide you can create immutable state easily with mutable way in reducer way.

```tsx
function reducer(
  draft: State,
  action: { type: 'reset' | 'increment' | 'decrement' }
) {
  switch (action.type) {
    case 'reset':
      return initialState;
    case 'increment':
      return void draft.count++;
    case 'decrement':
      return void draft.count--;
  }
}

export function App() {
  const [state, dispatch] = useMutativeReducer(reducer, initialState);

  return (
    <div>
      Count: {state.count}
      <br />
      <button onClick={() => dispatch({ type: 'increment' })}>Increment</button>
      <button onClick={() => dispatch({ type: 'decrement' })}>Decrement</button>
      <button onClick={() => dispatch({ type: 'reset' })}>Reset</button>
    </div>
  );
}
```

### Patches

In some cases, you may want to get that patches from your update, we can pass `{ enablePatches: true }` options in `useMutative` or `useMutativeReducer`, that can provide you the ability to get that patches from pervious action.

```tsx
const [state, setState, patches, inversePatches] = useMutative(initState, {
  enablePatches: true,
});

const [state, dispatch, patchState] = useMutativeReducer(
  reducer,
  initState,
  initializer,
  { enablePatches: true }
);

// actions be that actions that are applied in previous state.
const [actions, patchGroup] = patchState;

const [patches, inversePatches] = patches;
```

patches format will follow https://jsonpatch.com/, but the `"path"` field be array structure.
