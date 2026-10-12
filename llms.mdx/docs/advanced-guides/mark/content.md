# Marking data structure (/docs/advanced-guides/mark)

Decide with the mark option which values Mutative drafts, which it leaves mutable, and how it copies them.

By default, Mutative drafts plain objects, arrays, Maps and Sets, and leaves every other value as it is: a class instance, a `Date` or an object without a prototype in the state is shared by the draft, the base state and the next state. The `mark` option changes that for the values you choose, without changing the values or their classes.

## Mark functions [#mark-functions]

A mark is a function that receives each value that a recipe reads from a draft, and `{ mutable: 'mutable', immutable: 'immutable' }`. It returns:

* `'immutable'` to draft the value, such as a class instance. Mutative copies it when the recipe changes it, keeping its prototype.
* `'mutable'` to keep the value out of drafts. The recipe reads and changes the value itself, and every value that it holds, and the next state shares it.
* A function that returns a shallow copy of the value, to draft it with that copy.
* Nothing, to draft the value as usual.

```ts
import { create } from 'mutative';

class Todo {
  done = false;
  constructor(public text: string) {}
  toggle() {
    this.done = !this.done;
  }
}

const cache = { hits: 0 };

const baseState = {
  todos: [new Todo('learn'), new Todo('ship')],
  cache,
};

const state = create(
  baseState,
  (draft) => {
    draft.todos[0].toggle();
    draft.cache.hits += 1;
  },
  {
    mark: (target, { immutable, mutable }) => {
      if (target instanceof Todo) return immutable;
      if (target === cache) return mutable;
      return undefined;
    },
  }
);

// The changed instance is a copy of the same class.
expect(state.todos[0]).toBeInstanceOf(Todo);
expect(state.todos[0].done).toBe(true);
expect(baseState.todos[0].done).toBe(false);
expect(state.todos[1]).toBe(baseState.todos[1]);

// The mutable object was changed in place.
expect(state.cache).toBe(cache);
expect(cache.hits).toBe(1);
```

Pass a list of marks to combine them: the first one that returns a value decides, as in `mark: [markSimpleObject, markTodos]`. [`markSimpleObject()`](/docs/api-reference/marksimpleobject) is a mark for objects without a prototype and plain objects of other realms.

Use the same marks for every call on the same state: [`makeCreator({ mark })`](/docs/api-reference/makecreator) sets them as defaults, and [`apply()`](/docs/api-reference/apply) and [`isDraftable()`](/docs/api-reference/isdraftable) take them as an option. A base state that is a class instance needs an `immutable` mark, or `create()` throws.

## Patches, auto-freeze and strict mode [#patches-auto-freeze-and-strict-mode]

* Values marked `immutable` work with patches and auto-freeze like plain objects, and so does a mark that makes every object immutable, as `() => 'immutable'` does.
* A mark that returns a copy function cannot be combined with patches or auto-freeze, which development builds report with an error, and some patches might not apply to such values.
* In [strict mode](/docs/advanced-guides/strict-mode), reading a value marked `mutable` from a draft throws outside [`unsafe()`](/docs/api-reference/unsafe), as reading any value that is not drafted does.

## Custom shallow copies [#custom-shallow-copies]

A mark that returns a function drafts the value with the copy that the function returns, for values that the default copy does not handle, such as a `Date`:

```ts
import { create } from 'mutative';

const baseState = { updatedAt: new Date(Date.UTC(2020, 0, 1)) };

const state = create(
  baseState,
  (draft) => {
    const updatedAt = draft.updatedAt;
    updatedAt.setUTCFullYear(2021);
    updatedAt.setUTCMonth(5);
  },
  {
    mark: (target) =>
      target instanceof Date ? () => new Date(target.getTime()) : undefined,
  }
);

expect(state.updatedAt.toISOString()).toBe('2021-06-01T00:00:00.000Z');
expect(baseState.updatedAt.getUTCFullYear()).toBe(2020);
```

The first read of such a value returns its copy itself, and later reads return a draft of the copy. Changes through either reach the next state, but the methods of a `Date`, and of other objects that keep their data in internal slots or private fields, work only on the copy itself, so read such a value once and change it through that reference, as the recipe above does. To change a `Date` without a mark, assign a new one instead.

## Copying marked instances [#copying-marked-instances]

Mutative copies an instance that `mark` makes `immutable` with all its own properties, non-enumerable ones included, and reads its own accessors as values, as Immer's `setUseStrictShallowCopy('class_only')` does. To copy quickly, it assigns the own properties that are enumerable, writable and configurable instead of defining them, as Immer's default copy does. An own property that shadows a setter of its class, such as a class field over an accessor of a base class, therefore runs that setter on the copy, which can change objects that the copy shares with the base state, and one that shadows a getter without a setter or a read-only property makes the copy throw. Keep such values in accessors of the class or under other keys.
