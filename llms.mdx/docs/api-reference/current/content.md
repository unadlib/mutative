# current() (/docs/api-reference/current)

Take a snapshot of the current value of a draft, as plain objects without proxies.

`current(draft)` returns a snapshot of the current value of a draft: plain objects, arrays, Maps and Sets with the changes that the recipe has made so far, without the proxies of the draft. The snapshot stays valid after the recipe ends, so it can be logged, compared, kept or searched.

```ts
current<T>(draft: Draft<T>): T
```

## Usage [#usage]

```ts
import { create, current } from 'mutative';

const baseState = {
  foo: 'bar',
  list: [{ text: 'todo' }],
};

const state = create(baseState, (draft) => {
  draft.foo = 'foobar';
  draft.list.push({ text: 'learning' });

  const snapshot = current(draft.list);
  expect(snapshot).toEqual([{ text: 'todo' }, { text: 'learning' }]);

  draft.list.push({ text: 'shipping' });
  // Later changes do not reach the snapshot.
  expect(snapshot).toHaveLength(2);
});
```

* The snapshot shares every object that the recipe has not changed with the base state. For a draft that the recipe has not changed, `current(draft)` returns its original value, which [`original(draft)`](/docs/api-reference/original) also returns, without copying it.
* A changed draft is copied, together with its changed descendants, on every call, so each call returns new objects for it. Take one snapshot for a series of reads rather than calling `current()` in a loop.
* Later changes to the draft do not change the snapshot, except changes to objects that are not drafted, such as class instances that no mark makes draftable, which the snapshot shares with the draft.
* `current()` does not freeze the snapshot, also with `enableAutoFreeze`.
* `current()` throws for a value that is not a draft, such as the base state or a finished state; use [`isDraft()`](/docs/api-reference/isdraft) to check.

## Searching a large array [#searching-a-large-array]

Every object read through a draft becomes a draft of its own, so `draft.list.find()` pays for a draft per visited element. Searching `current(draft.list)` reads plain values instead: the original array while the recipe has not changed it, and otherwise a copy that holds the current value of each changed element and the original object of every other one. Its indices are those of the draft, also after the recipe added, removed or moved elements. Change the match through the draft. Its elements are not drafts, so the callback must only read them.

```ts
import { create, current } from 'mutative';

const baseState = {
  list: Array.from({ length: 1000 }, (_, id) => ({ id, done: false })),
};

const state = create(baseState, (draft) => {
  draft.list.shift();
  const index = current(draft.list).findIndex((item) => item.id === 500);
  draft.list[index].done = true;
});

expect(state.list[499]).toEqual({ id: 500, done: true });
expect(state.list[0]).toBe(baseState.list[1]);
```

In [strict mode](/docs/advanced-guides/strict-mode), development builds warn once when a recipe leaves 1,000 or more drafts unchanged, which is what a search through a large draft array does.

<Callout type="idea">
  [`original(draft.list)`](/docs/api-reference/original) searches the base state instead, whose indices no longer match those of the draft once the recipe has added, removed or moved elements.
</Callout>
