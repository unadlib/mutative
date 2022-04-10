# mutative

![Node CI](https://github.com/unadlib/mutative/workflows/Node%20CI/badge.svg)
[![npm](https://img.shields.io/npm/v/mutative.svg)](https://www.npmjs.com/package/mutative)

Efficient creation of immutable state

## APIs

- `create()`

```ts
const baseState = {
  foo: 'bar',
  list: [{ text: 'todo' }],
};

const { state } = create(baseState, (draft) => {
  draft.foo = 'foobar';
  draft.list.push({ text: 'learning' });
});
```

- `prepare()`

```ts
const baseState = {
  foo: 'bar',
  list: [{ text: 'todo' }],
};

const { draft, finalize } = prepare(baseState, { enableFreeze: true });
draft.foo = 'foobar';
draft.list.push({ text: 'learning' });
const { state } = finalize();
```

- `apply()`

```ts
const baseState = {
  foo: 'bar',
  list: [{ text: 'todo' }],
};

const { state, patches, inversePatches } = create(baseState, (draft) => {
  draft.foo = 'foobar';
  draft.list.push({ text: 'learning' });
}, {
  enablePatches: true,
});

const nextState = apply(state, patches);
```
