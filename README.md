# mutative

![Node CI](https://github.com/unadlib/mutative/workflows/Node%20CI/badge.svg)
[![npm](https://img.shields.io/npm/v/mutative.svg)](https://www.npmjs.com/package/mutative)

Efficient creation of immutable state

10x faster than immer

## Motivation

TBD

### Performance

TBD

### Features

- Apply patches
- Supports optional freezing
- Custom shallow copy
- Immutable and mutable data markable
- Strict mode for safer mutable data access

### Difference between Immer and Mutative

| -                             | Mutative |      Immer      |
| :---------------------------- | -------: | :-------------: |
| Best performance              |       ✅ |       ❌        |
| Custom shallow copy           |       ✅ |       ❌        |
| Strict mode                   |       ✅ |       ❌        |
| Default common data structure |       ✅ | ❌(auto freeze) |
| Non-invasive marking          |       ✅ |       ❌        |
| Automatic type inference      |       ✅ |       ❌        |
| Complete freeze data          |       ✅ |       ❌        |

## Installation

```sh
yarn install mutative # npm install mutative
```

## Examples

```ts
const baseState = {
  foo: 'bar',
  list: [{ text: 'coding' }],
};

const state = create(baseState, (draft) => {
  draft.foo = 'foobar';
  draft.list.push({ text: 'learning' });
});
```

## Migration from Immer to Mutative

TBD

## APIs

- `create()`

```ts
const baseState = {
  foo: 'bar',
  list: [{ text: 'todo' }],
};

const state = create(baseState, (draft) => {
  draft.foo = 'foobar';
  draft.list.push({ text: 'learning' });
});
```

- `apply()`

```ts
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

const nextState = apply(baseState, patches);
expect(nextState).toEqual(state);
const prevState = apply(state, inversePatches);
expect(prevState).toEqual(baseState);
```

- `current()`

```ts
const baseState = {
  foo: 'bar',
  list: [{ text: 'todo' }],
};

const state = create(baseState, (draft) => {
  draft.foo = 'foobar';
  draft.list.push({ text: 'learning' });
  expect(current(draft.list)).toEqual([{ text: 'todo' }, { text: 'learning' }]);
});
```

- `original()`

```ts
const baseState = {
  foo: 'bar',
  list: [{ text: 'todo' }],
};

const state = create(baseState, (draft) => {
  draft.foo = 'foobar';
  draft.list.push({ text: 'learning' });
  expect(original(draft.list)).toEqual([{ text: 'todo' }]);
});
```

- `isDraft()`
- `unsafe()`
- `castDraft()`
- `castImmutable()`
- `Mutable<T>`
- `Immutable<T>`
- `Patches`
- `Patch`

## FAQs

TBD
