# mutative

![Node CI](https://github.com/unadlib/mutative/workflows/Node%20CI/badge.svg)
[![npm](https://img.shields.io/npm/v/mutative.svg)](https://www.npmjs.com/package/mutative)

Efficient creation of immutable state

10x faster than immer

## Motivation

TBD

### Performance

```
naive handcrafted reducer x 3,661 ops/sec ±2.40% (96 runs sampled)
mutative - without autoFreeze x 5,437 ops/sec ±1.46% (95 runs sampled)
immer - without autoFreeze x 7.63 ops/sec ±0.39% (24 runs sampled)
mutative - with autoFreeze x 897 ops/sec ±0.93% (98 runs sampled)
immer - with autoFreeze x 321 ops/sec ±0.71% (92 runs sampled)
mutative - with patches x 748 ops/sec ±1.23% (94 runs sampled)
immer - with patches x 7.60 ops/sec ±0.32% (23 runs sampled)
mutative - with patches and autoFreeze x 419 ops/sec ±0.31% (94 runs sampled)
immer - with patches and autoFreeze x 245 ops/sec ±0.66% (90 runs sampled)
The fastest method is mutative - without autoFreeze
```

### Features

- Apply patches
- Supports optional freezing
- Custom shallow copy
- Immutable and mutable data markable
- Strict mode for safer mutable data access

### Difference between Immer and Mutative

| -                             | Mutative |      Immer      |
| :---------------------------- | -------: | :-------------: |
| Custom shallow copy           |       ✅ |       ❌        |
| Strict mode                   |       ✅ |       ❌        |
| Default common data structure |       ✅ | ❌(auto-freeze) |
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
