# apply() (/docs/api-reference/apply)

Apply patches to a state and get the next state, or change the state in place.

`apply()` applies [patches](/docs/advanced-guides/patches), such as those that [`create()`](/docs/api-reference/create) returns with `enablePatches`, and returns the next state. Like `create()`, it leaves the state as it was and shares every part that the patches do not change.

```ts
apply(state, patches, options?) // the next state
apply(state, patches, { mutable: true }) // changes the state in place and returns undefined
```

## Usage [#usage]

```ts
import { apply, create } from 'mutative';

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

<a id="applystate-patches-options" />

## Options [#options]

| Option             | Type             | Default |
| ------------------ | ---------------- | ------- |
| `enableAutoFreeze` | `boolean`        | `false` |
| `strict`           | `boolean`        | `false` |
| `mark`             | `Mark \| Mark[]` | none    |
| `mutable`          | `boolean`        | `false` |

`enableAutoFreeze`, `strict` and `mark` work as the [options of `create()`](/docs/api-reference/create#options) do. Pass `apply()` the same `mark` as the `create()` calls that generated the patches, so that it drafts the same values, such as class instances.

`mutable: true`, available since Mutative 1.2.0, changes the state in place instead, and `apply()` then returns `undefined`. It cannot be combined with the other options, which development builds report with a warning, and it throws for a patch that replaces the root state with another value, such as the patch of a recipe that returns a new state, because the state cannot be replaced in place.

```ts
import { apply } from 'mutative';

const baseState = { foo: { bar: 'test' } };

// This changes baseState itself.
const result = apply(
  baseState,
  [
    {
      op: 'replace',
      path: ['foo', 'bar'],
      value: 'test2',
    },
  ],
  {
    mutable: true,
  }
);

expect(result).toBeUndefined();
expect(baseState).toEqual({ foo: { bar: 'test2' } });
```

## Applying patches to a draft [#applying-patches-to-a-draft]

Inside a recipe, `apply(draft, patches)` changes the draft in place and returns it, so patches can be combined with other changes in one update. It takes no options there.

```ts
import { apply, create } from 'mutative';

const baseState = { count: 0, log: [] as string[] };

const state = create(baseState, (draft) => {
  apply(draft, [{ op: 'replace', path: ['count'], value: 1 }]);
  draft.log.push('count set to 1');
});

expect(state).toEqual({ count: 1, log: ['count set to 1'] });
```

## Patches that apply() accepts [#patches-that-apply-accepts]

* `add`, `remove` and `replace` operations. Other operations, such as JSON Patch's `move`, `copy` and `test`, throw an error.
* Paths as arrays of keys, or as JSON Pointer strings, such as those of `pathAsArray: false`. The index `-` appends to an array.
* Map keys as they are, and Set items by value: `add` and `remove` patches add and remove the value that they hold, and a `replace` patch of a Set item throws. See [Sets of objects](/docs/advanced-guides/patches#sets-of-objects).
* A path through the `__proto__` or `constructor` of an object or array, or through the `prototype` of a function, throws, so that patches cannot change the prototypes of objects; Map keys of these names are ordinary keys. `apply()` reads the other path segments as properties, as Immer does, and does not guard against prototypes that other code has already changed.
* A path that does not resolve throws an error that names it.

`apply()` copies the value of each patch deeply before applying it, so the next state does not share objects with the patches, and applying the same patches again gives another copy.

## TypeScript [#typescript]

With `enableAutoFreeze: true`, `apply()` returns `Immutable<State>`, as `apply<State, true>()` does. With `enableAutoFreeze` typed as `boolean` or optional `true`, the result is `State | Immutable<State>`. With `mutable: true`, the result is `void`, and with `mutable` typed as `boolean`, optional `boolean`, or optional `true`, it is `State | void`.

The errors that `apply()` throws are listed with their production codes on the [errors page](/docs/extra-topics/errors).
