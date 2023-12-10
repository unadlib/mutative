---
sidebar_position: 2
---

# apply()

Use `apply()` for applying [patches](/docs/advanced-guides/pathes) to get the new state.

## Usage

```ts
import { create, apply } from 'mutative';

const baseState = {
  foo: 'bar',
  list: [{ text: 'todo' }],
};

const [state, patches, inversePatches] = create(
  baseState,
  (draft) => {
    draft.foo = 'foobar';
    draft.list.push({ text: 'learning' });
  },
  {
    enablePatches: true,
  }
);

// you can apply patches to get the new state
const nextState = apply(baseState, patches);

expect(nextState).toEqual(state);
const prevState = apply(state, inversePatches);
expect(prevState).toEqual(baseState);
```

