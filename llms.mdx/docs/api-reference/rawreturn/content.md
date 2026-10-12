# rawReturn() (/docs/api-reference/rawreturn)

Return a value from a recipe as it is, without searching it for drafts, or return undefined.

`rawReturn(value)` wraps the value that a recipe returns, so that `create()` makes it the next state as it is, without searching it for drafts. It also makes `undefined` the next state, which a recipe that returns nothing cannot.

```ts
rawReturn<T extends object | undefined>(value: T): T
```

## Usage [#usage]

```ts
import { create, rawReturn } from 'mutative';

const baseState = { id: 'test' };

const state = create(baseState as { id: string } | undefined, () => {
  return rawReturn(undefined);
});

expect(state).toBe(undefined);
```

A recipe can return a new state instead of changing the draft. Mutative searches such a value for drafts and replaces each one with its value, so that a returned value can hold drafts, as `{ ...draft, a: 2 }` does:

```ts
import { create, isDraft } from 'mutative';

const baseState = { a: 1, b: { c: 1 } };

const state = create(baseState, (draft) => {
  return {
    ...draft,
    a: 2,
  };
});

expect(state).toEqual({ a: 2, b: { c: 1 } });
expect(isDraft(state.b)).toBe(false);
expect(state.b).toBe(baseState.b);
```

That search visits every object of the returned value, which takes time for large values. `rawReturn()` skips it for a value that holds no drafts, such as a state built from scratch or an earlier state:

```ts
import { create, rawReturn } from 'mutative';

const initialState = { todos: [] as string[] };
const baseState = { todos: ['learn'] };

// A reducer that resets the state.
const state = create(baseState, () => rawReturn(initialState));

expect(state).toBe(initialState);
```

In the benchmark, returning a new state of 10,000 rows took 2.6 ms with the search and 0.26 µs with `rawReturn()`. Development builds warn when a returned object holds no drafts, to suggest `rawReturn()`.

## Performance compared with Immer [#performance-compared-with-immer]

Returning an earlier state is the one workload of the [benchmark](/docs/getting-started/performance) in which Mutative's defaults were slower than Immer's. Immer freezes each next state by default and skips frozen values when it searches a returned state for drafts, so returning a state that it had frozen earlier took it 0.79 µs at 10,000 rows, while Mutative, which does not freeze by default, searched the same state for 2.6 ms. With the same settings, Mutative was faster: 2.6 ms against 5.7 ms without auto-freeze, and 0.53 µs against 0.79 µs with it, since its production builds skip frozen values too. `rawReturn()` returns a state that holds no drafts in 0.26 µs.

Freezing by default is a trade-off rather than a shortcut. Data that is not frozen yet, such as a response parsed from JSON, has to be frozen first: returning 10,000 rows that each call creates took Immer 9.2 ms with its default, against 3.1 ms for Mutative's search and 0.23 ms with `rawReturn()`, of which creating the rows took 0.19 ms. Freezing also made Immer slower in every other workload of the [selected results](/docs/getting-started/performance#mutative-vs-immer), such as 25.0 µs instead of 1.82 µs to update an item of 100 rows. [Auto Freeze](/docs/advanced-guides/auto-freeze) describes when freezing is worth its cost.

## Rules [#rules]

* Never wrap a value that holds drafts. Without strict mode, Mutative does not search it, so the next state keeps those drafts, which are revoked when the recipe ends and throw when they are read. In [strict mode](/docs/advanced-guides/strict-mode), Mutative still searches a value that `rawReturn()` wraps and replaces its drafts, and development builds warn: `The return value contains drafts, please don't use 'rawReturn()' to wrap the return value.`
* Call it with exactly one argument; it throws otherwise.
* Wrap only objects and `undefined`. A recipe can return a primitive as it is, since a primitive holds no drafts, and development builds warn when `rawReturn()` receives one.
* With auto-freeze, production builds do not search frozen objects in a returned value or the values they hold, so returning an earlier, frozen state, or state built from one, costs little even without `rawReturn()`. Development builds still search them and throw when they find a draft there, so never put a draft in a frozen object or in a value it holds.

<Callout type="idea">
  Enable strict mode in development when you use `rawReturn()`, for example with `strict: process.env.NODE_ENV !== 'production'`, so that a wrapped value that holds drafts is reported.
</Callout>
