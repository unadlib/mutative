---
sidebar_position: 1
---

# Introduction

**Mutative** - A JavaScript library for efficient immutable updates, 2-6x faster than naive handcrafted reducer, and more than 10x faster than Immer.

## What is Mutative?

Mutative can help simplify the updating of immutable data structures, such as those used in React and Redux. It allows you to write code in a mutable way for the draft object, and ultimately it produces a new immutable data structure (the next state), avoiding unnecessary accidental mutations or complex deep updates with spread operations.

- **Syntax conciseness**: Mutative makes code more concise and intuitive by providing a draft object that can be directly modified. Traditional reducers require manual handling of object and array immutability, which often involves complex spread and copying operations.

- **Performance**: Mutative provides higher performance than manually written reducers, especially when processing large data structures.

- **Error reduction**: Writing immutable updates by hand is usually difficult, prone to errors, and cumbersome. It is easy to make the mistake of directly modifying the state, rather than returning the next state. Mutative avoids this type of problem through its design, as all modifications occur on the draft object, and finally a new immutable data is produced.

For example, assume there is a state object that includes a list. We aim to mark the last item in the list as completed and then add a new item:

```ts
const state = {
  list: [
    { text: 'Learn TypeScript', done: true },
    { text: 'Learn React', done: true },
    { text: 'Learn Redux', done: false },
  ],
};
```

If we were to use traditional immutable data updates, we might write it like this:

```ts
const nextState = {
  ...state,
  list: [
    ...state.list.slice(0, 2),
    {
      ...state.list[2],
      done: true,
    },
    { text: 'Learn Mutative', done: true },
  ],
};
```

Using Mutative, we could write it like this:

```ts
import { create } from 'mutative';

const nextState = create(state, (draft) => {
  draft.list[2].done = true;
  draft.list.push({ text: 'Learn Mutative', done: true });
});
```

This is the basic usage of Mutative, which can help us implement immutable updates more simply.

## Motivation

Immer helps us write simpler immutable updates with `mutative` logic.

But its performance issue causes a runtime performance overhead. Immer must have auto-freeze enabled by default(Performance will be worse if auto-freeze is disabled), such immutable state with Immer is not common. In scenarios such as cross-processing, remote data transfer, etc., these immutable data must be constantly frozen.

There are more parts that could be improved, such as better type inference, non-intrusive markup, support for more types of immutability, Safer immutability, [more edge cases](https://github.com/unadlib/mutative/blob/main/test/immer-non-support.test.ts), and so on.

This is why Mutative was created.

## Features and Benefits

- **Mutation makes immutable updates** - Immutable data structures supporting objects, arrays, Sets and Maps.
- **High performance** - 10x faster than immer by default, even faster than naive handcrafted reducer.
- **Optional freezing state** - No freezing of immutable data by default.
- **Support for JSON Patch** - Full compliance with JSON Patch specification.
- **Custom shallow copy** - Support for more types of immutable data.
- **Support mark for immutable and mutable data** - Allows for non-invasive marking.
- **Safer mutable data access in strict mode** - It brings more secure immutable updates.
- **Support for reducer** - Support reducer function and any other immutable state library.

## Credits

Mutative is inspired by [Immer](https://immerjs.github.io/immer/). It is a great library that has helped many people write simpler immutable updates. Mutative is based on the same idea, but it has a different implementation and more features.
