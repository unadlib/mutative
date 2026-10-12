# original() (/docs/api-reference/original)

Get the value that a draft was created from, without the changes of the recipe.

`original(draft)` returns the value that a draft was created from: the object of the base state, without the changes that the recipe has made to it.

```ts
original<T>(draft: T): T
```

## Usage [#usage]

```ts
import { create, original } from 'mutative';

const baseState = {
  foo: 'bar',
  list: [{ text: 'todo' }],
};

const state = create(baseState, (draft) => {
  draft.foo = 'foobar';
  draft.list.push({ text: 'learning' });

  expect(original(draft.list)).toEqual([{ text: 'todo' }]);
  expect(original(draft.list)).toBe(baseState.list);
  expect(original(draft.list)).not.toBe(draft.list);
});
```

Use it to compare a draft with its original value, or to read the base state without creating drafts, since the original value holds no proxies.

* `original()` returns the object of the base state itself, so never change it.
* It throws for a value that is not a draft, such as the base state, a finished state, or a value that the recipe assigned, which Mutative does not draft. Use [`isDraft()`](/docs/api-reference/isdraft) to check.
* An object of the base state is drafted when the recipe reads it, so a search of a draft array for such an object does not find it; search `original(draft.list)` for it, as in `original(draft.list).indexOf(item)`.

`original()` reflects the state before the recipe's changes, so an index found in `original(draft.list)` no longer matches the draft once the recipe has added, removed or moved elements. To search a draft array, use [`current()`](/docs/api-reference/current#searching-a-large-array).
