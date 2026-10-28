# Patches (/docs/advanced-guides/patches)

Record the changes of a recipe as patches, and apply them to a state with apply().

With the `enablePatches` option, `create()` also returns the patches that turn the base state into the next state, and the inverse patches that turn the next state back into the base state. [`apply()`](/docs/api-reference/apply) applies them, for example to replay changes on another copy of the state, to send them over a network, or to undo and redo changes.

## Generating and applying patches [#generating-and-applying-patches]

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

expect(patches).toEqual([
  { op: 'add', path: ['list', 1], value: { text: 'learning' } },
  { op: 'replace', path: ['foo'], value: 'foobar' },
]);
expect(inversePatches).toEqual([
  { op: 'replace', path: ['list', 'length'], value: 1 },
  { op: 'replace', path: ['foo'], value: 'bar' },
]);

expect(apply(baseState, patches)).toEqual(state);
expect(apply(state, inversePatches)).toEqual(baseState);
```

`enablePatches` also works with curried producers, manual drafts and [`makeCreator()`](/docs/api-reference/makecreator), and it supports objects, arrays, Maps, Sets, and the values that a [`mark`](/docs/advanced-guides/mark) makes draftable; pass the same `mark` to `apply()`.

## Patch behavior [#patch-behavior]

* **Operations and paths.** Patches use `add`, `remove` and `replace`. A path leads from the root to the changed value through object keys, array indices, Map keys as they are, objects and arrays included, and the positions of Set items. A recipe that returns a new state gets one `replace` patch with an empty path.
* **Order.** The patches of a nested draft come before those of its parents, as in Immer.
* **Values.** A patch value is the object that the next state holds, frozen with it when `enableAutoFreeze` is on, so copy a patch value before changing it. `apply()` copies patch values before applying them.
* **Arrays.** `shift()`, `unshift()`, `splice()`, `reverse()` and `sort()` emit a `replace` patch for each index whose element changed, and an `add` patch for each index past the old length. An array that gets shorter gets one `replace` patch of its `length` by default, or a `remove` patch for each index it loses with `arrayLengthAssignment: false`. Patches preserve holes in both directions: filling a hole takes a `replace` patch, and recreating one rebuilds the array from its index; see [Sparse arrays](#sparse-arrays).
* **Maps.** `set()` emits an `add` patch for a new key and a `replace` patch for an existing one, and `delete()` a `remove` patch.
* **Sets.** Patches add an item by its value and remove one by the value it holds; see [Sets of objects](#sets-of-objects).
* **Moved drafts.** A changed draft that leaves its key, because `sort()` or an assignment moved it or another value replaced it there, emits no patches under its old path; the patches of its parent carry its value.
* **Applying patches.** `apply()` applies `add`, `remove` and `replace` patches and accepts `-` as the index that appends to an array. It throws for other operations and for paths through `__proto__` or `constructor`. It takes the `enableAutoFreeze`, `strict` and `mark` options, or `mutable: true` to change the state in place, which throws for a patch that replaces the root state with another value, and it changes a draft in place.
* **JSON Patch.** With `pathAsArray: false` and `arrayLengthAssignment: false`, patches of JSON-compatible objects and arrays are JSON Patch operations. Maps, Sets and array holes have no JSON counterpart.

[Comparison with Immer](/docs/extra-topics/comparison-with-immer#patches) lists where these patches differ from Immer's.

## JSON patches [#json-patches]

`enablePatches` takes `true`, or an object with two options that set the shape of the patches. With both set to `false`, patches of JSON-compatible objects and arrays are [JSON Patch](https://datatracker.ietf.org/doc/html/rfc6902) operations, which other JSON Patch libraries can apply ([related discussion](https://github.com/unadlib/mutative/issues/6)).

### pathAsArray - default: true [#pathasarray---default-true]

With `pathAsArray: false`, a path is a JSON Pointer string instead of an array of keys:

```ts
import { create } from 'mutative';

const [state, patches, inversePatches] = create(
  { list: [1, 2, 3] },
  (draft) => {
    draft.list.length = 0;
  },
  {
    enablePatches: {
      pathAsArray: false,
    },
  }
);

expect(state).toEqual({ list: [] });
expect(patches).toEqual([{ op: 'replace', path: '/list/length', value: 0 }]);
expect(inversePatches).toEqual([
  { op: 'add', path: '/list/0', value: 1 },
  { op: 'add', path: '/list/1', value: 2 },
  { op: 'add', path: '/list/2', value: 3 },
]);
```

A string path holds only strings, so it cannot name a Map key that is not a string, or a symbol key: with `pathAsArray: false`, the patch of `draft.set(1, 'b')` would set the key `'1'`. Keep the default array paths for such keys; development builds throw an error when a string path would hold one.

### arrayLengthAssignment - default: true [#arraylengthassignment---default-true]

With `arrayLengthAssignment: false`, an array that gets shorter gets a `remove` patch for each index that it loses, instead of a `replace` patch of its `length`:

```ts
import { create } from 'mutative';

const [state, patches, inversePatches] = create(
  { list: [1, 2, 3] },
  (draft) => {
    draft.list.length = 0;
  },
  {
    enablePatches: {
      arrayLengthAssignment: false,
    },
  }
);

expect(state).toEqual({ list: [] });
expect(patches).toEqual([
  { op: 'remove', path: ['list', 2] },
  { op: 'remove', path: ['list', 1] },
  { op: 'remove', path: ['list', 0] },
]);
expect(inversePatches).toEqual([
  { op: 'add', path: ['list', 0], value: 1 },
  { op: 'add', path: ['list', 1], value: 2 },
  { op: 'add', path: ['list', 2], value: 3 },
]);
```

<Callout type="idea">
  A `remove` patch per index takes more time and more patches for large arrays than one `replace` patch of the `length`, so leave `arrayLengthAssignment` on unless the patches must be JSON Patch operations.
</Callout>

## Sparse arrays [#sparse-arrays]

A hole is an absent index, which differs from an own index whose value is `undefined`: array methods such as `map()` and `forEach()` skip holes. Patches and inverse patches preserve this distinction, including when a recipe lengthens an array, fills a hole with `undefined`, or moves holes with an array method.

```ts
const base = new Array<number>(2);
base[0] = 1;

const [state, patches, inverse] = create(base, (draft) => {
  draft.unshift(0);
}, { enablePatches: true });

expect(2 in state).toBe(false);
expect(2 in apply(base, patches)).toBe(false);
expect(1 in apply(state, inverse)).toBe(false);
```

An index patch carries a value, so it cannot represent a hole. Filling a hole takes a `replace` patch, but the patches that recreate a hole shorten the array to its index, lengthen it again to leave holes, and restore the elements after it, so their number grows with those elements: filling a hole before 10,000 elements yields one patch and 10,002 inverse patches. A recipe that makes a hole before the last element gets such patches, and inverse patches that fill it. Holes that an array gets past its old length need only a `replace` patch of its `length`. These patches preserve the array itself for mutable application and application on a draft, also inside a Set.

With `arrayLengthAssignment: false`, truncation still uses per-index `remove` patches, but recreating holes needs a `replace` patch of `length`. Apply these patches with Mutative's `apply()`: sparse arrays are JavaScript data, not JSON data, so their patches are not portable JSON Patch operations. JSON serialization turns array holes into `null` and cannot preserve their structure.

## Undo and redo [#undo-and-redo]

The inverse patches of each change undo it, and its patches redo it:

```ts
import { apply, create, type Patches } from 'mutative';

let state = { todos: [] as string[] };
const undoStack: { patches: Patches; inversePatches: Patches }[] = [];

function update(recipe: (draft: typeof state) => void) {
  const [nextState, patches, inversePatches] = create(state, recipe, {
    enablePatches: true,
  });
  state = nextState;
  undoStack.push({ patches, inversePatches });
}

update((draft) => {
  draft.todos.push('learn Mutative');
});
update((draft) => {
  draft.todos.push('use patches');
});

const last = undoStack.pop()!;
state = apply(state, last.inversePatches);
expect(state.todos).toEqual(['learn Mutative']);

state = apply(state, last.patches);
expect(state.todos).toEqual(['learn Mutative', 'use patches']);
```

[travels](https://github.com/mutativejs/travels) builds undo and redo with history limits, archives and persistence on these patches, and [use-travel](https://github.com/mutativejs/use-travel) and [zustand-travel](https://github.com/mutativejs/zustand-travel) bring it to React and Zustand.

## Sets of objects [#sets-of-objects]

Patches add a Set element by its value and remove one by the value it holds, so a `remove` patch removes an object only from a Set that holds that same object. A Set whose elements changed in place, without any element added or removed, gets patches under the position of each changed element, and they replay in both directions. Once a recipe adds or removes elements of a Set, the Set's `remove` and `add` patches carry every changed element by value instead. `apply()` copies the value of each patch before applying it, so a Set that `apply()` changes holds copies of the objects that patches add, and the inverse patches cannot remove those copies: an undo after a redo leaves the object in the Set. `apply()` also appends every element that it adds, so a Set that it changes can hold its elements in another order than the state that the recipe produced: a changed element of a Set that also added or removed elements, or an element that inverse patches add back, moves to the end, and a recipe that deletes an element and adds it back moves it to the end without a patch. The positions in the patches of a later recipe then find other elements, and its changes under them apply to another element without an error. Sets of primitives keep their elements, but their order can change in the same way. When patches are replayed on states that `apply()` returned, as undo, redo and synchronized copies do, keep such objects in a Map keyed by an id or in an array instead.
