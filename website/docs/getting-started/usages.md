---
sidebar_position: 2
---

# Usages


## Use `create()` to create a new state

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
```

`create(baseState, (draft) => void, options?: Options): newState`

The first argument of `create()` is the base state. Mutative drafts it and passes it to the arguments of the draft function, and performs the draft mutation until the draft function finishes, then Mutative will finalize it and produce the new state.

Use `create()` for more advanced features by [setting `options`](#createstate-fn-options).
