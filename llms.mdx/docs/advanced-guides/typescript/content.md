# TypeScript (/docs/advanced-guides/typescript)

How Mutative types drafts, results, producers and patches, and the types and casts it exports.

Mutative is written in TypeScript and ships its type declarations. They support TypeScript 5.0 and later; the package checks compile them with TypeScript 5.0.

## Inferred types [#inferred-types]

`create()` infers the type of the state from the base state. The draft has the type `Draft<State>`, which removes `readonly` deeply, so a recipe can change state that is typed as readonly, and the result has the type of the base state:

```ts
import { create } from 'mutative';

type State = {
  readonly todos: readonly { readonly text: string; readonly done: boolean }[];
};

const baseState: State = { todos: [{ text: 'learn', done: false }] };

const state: State = create(baseState, (draft) => {
  draft.todos[0].done = true;
  draft.todos.push({ text: 'ship', done: false });
});

expect(state.todos).toHaveLength(2);
```

The options change the type of the result: `enablePatches: true` gives `[State, Patches, Patches]`, `enableAutoFreeze: true` gives `Immutable<State>`, and an async recipe gives a Promise. See [create()](/docs/api-reference/create#enablepatches) for options typed as `boolean`, and [apply()](/docs/api-reference/apply#typescript) for its result types.

When the base state does not have the type of the state, such as an empty array, pass the state type as a type argument:

```ts
import { create } from 'mutative';

type State = { items: string[] };

const state = create<State>({ items: [] }, (draft) => {
  draft.items.push('a');
});

expect(state.items).toEqual(['a']);
```

With an explicit state type, TypeScript infers no other type argument, so pass `boolean` as the type argument for `enablePatches` when the options set it with a variable, as in `create<State, false, boolean>(base, recipe, options)`.

## `Draft<T>` and `Immutable<T>` [#draftt-and-immutablet]

* `Draft<T>` is the type of a draft of `T`: its objects, arrays, Maps and Sets without `readonly`, deeply. Functions, Promises, dates and regular expressions keep their types, and the keys of a Map are not drafted.
* `Immutable<T>` is a deeply readonly `T`, with `ReadonlyMap` and `ReadonlySet` for Maps and Sets: the type of a frozen state.

Use `Draft<State>` to type helpers that change a draft:

```ts
import { create, type Draft } from 'mutative';

type State = { todos: { text: string; done: boolean }[] };

function addTodo(draft: Draft<State>, text: string) {
  draft.todos.push({ text, done: false });
}

const state = create({ todos: [] } as State, (draft) => {
  addTodo(draft, 'learn');
});

expect(state.todos).toEqual([{ text: 'learn', done: false }]);
```

## Producers [#producers]

Annotate the draft parameter of a recipe without a base state, so that the producer has typed parameters and a typed result. Its other parameters become the producer's:

```ts
import { create } from 'mutative';

type Todo = { text: string; done: boolean };

const toggle = create((draft: Todo[], index: number) => {
  draft[index].done = !draft[index].done;
});

const todos: Todo[] = toggle([{ text: 'learn', done: false }], 0);

expect(todos[0].done).toBe(true);
```

The type arguments `create<Todo[], [index: number]>((draft, index) => { … })` give the same producer. In a generic function, annotate the draft with the type parameter, as in `create((draft: T) => { … })`, and leave out the type argument for async recipes; see [Async recipes](/docs/api-reference/create#async-recipes).

## Casts [#casts]

`castDraft()`, `castImmutable()` and `castMutable()` change only the type of a value, and return the value as it is:

* `castDraft(value)` types a value as a draft, for example to assign a readonly value into a draft.
* `castImmutable(value)` types a value as `Immutable<T>`, for example an initial state that should be read only. It does not freeze the value.
* `castMutable<T>(draft)` types a draft as `T`, for a function that requires `T` where `Draft<T>` does not fit, such as a class with private members, which a draft type lacks.

```ts
import { castDraft, castImmutable, castMutable, create } from 'mutative';

type Todo = { text: string; done: boolean };

const defaults = castImmutable({ todos: [{ text: 'learn', done: false }] as Todo[] });

const state = create({ todos: [] as Todo[] }, (draft) => {
  // `defaults.todos` is readonly, which a draft does not accept without a cast.
  draft.todos = castDraft(defaults.todos);
});

expect(state.todos).toBe(defaults.todos);

class Point {
  constructor(
    private x: number,
    private y: number
  ) {}
  distanceTo(other: Point) {
    return Math.hypot(other.x - this.x, other.y - this.y);
  }
}

const origin = new Point(0, 0);

create({ point: new Point(3, 4) }, (draft) => {
  // The draft type of a Point lacks its private members.
  expect(origin.distanceTo(castMutable<Point>(draft.point))).toBe(5);
});
```

## Exported types [#exported-types]

| Type               | Description                                                                                                                 |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `Draft<T>`         | The type of a draft of `T`.                                                                                                 |
| `Immutable<T>`     | A deeply readonly `T`.                                                                                                      |
| `Patch<P>`         | An `add`, `remove` or `replace` operation; its path is a string when `P` is `{ pathAsArray: false }`.                       |
| `Patches<P>`       | An array of patches.                                                                                                        |
| `PatchesOptions`   | The type of the `enablePatches` option.                                                                                     |
| `Options<O, F>`    | The options of `create()` and `makeCreator()`, where `O` is the type of `enablePatches` and `F` that of `enableAutoFreeze`. |
| `DraftedObject<T>` | The draft type of an object type.                                                                                           |

The [API reference in the repository](https://github.com/unadlib/mutative/tree/main/docs) lists their definitions, generated from the source.
