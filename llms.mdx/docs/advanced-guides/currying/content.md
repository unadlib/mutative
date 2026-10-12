# Currying (/docs/advanced-guides/currying)

Create producers that take the base state and more arguments, and drafts that you finalize later.

Besides `create(base, recipe)`, [`create()`](/docs/api-reference/create) has two curried forms: a recipe alone gives a producer, a function that takes the base state later, and a base state alone gives a draft that you finalize later.

## Producers [#producers]

`create(recipe, options?)` returns a producer, `(base, ...args) => nextState`. The producer drafts its first argument and passes the draft and its other arguments to the recipe:

```ts
import { create } from 'mutative';

type Todo = { text: string; done: boolean };

const toggle = create((draft: Todo[], index: number) => {
  draft[index].done = !draft[index].done;
});

const todos: Todo[] = [
  { text: 'learn', done: false },
  { text: 'ship', done: false },
];

const nextTodos = toggle(todos, 1);

expect(nextTodos[1].done).toBe(true);
expect(nextTodos[0]).toBe(todos[0]);
```

A producer with an action argument is a reducer, for Redux, `useReducer()` or any other library that takes one:

```ts
import { create } from 'mutative';

type State = { todos: { text: string; done: boolean }[] };

type Action =
  | { type: 'add'; text: string }
  | { type: 'toggle'; index: number };

const reducer = create((draft: State, action: Action) => {
  switch (action.type) {
    case 'add':
      draft.todos.push({ text: action.text, done: false });
      break;
    case 'toggle':
      draft.todos[action.index].done = !draft.todos[action.index].done;
      break;
  }
});

const initialState: State = { todos: [] };
const state = [
  { type: 'add', text: 'learn' } as const,
  { type: 'toggle', index: 0 } as const,
].reduce(reducer, initialState);

expect(state.todos).toEqual([{ text: 'learn', done: true }]);
```

* The options of the call apply to every state that the producer makes, so `create(recipe, { enablePatches: true })` gives a producer that returns `[nextState, patches, inversePatches]`.
* The producer calls the recipe with its own `this`, so it can be a method.
* A producer of an async recipe returns a Promise of the next state.
* In TypeScript, annotate the type of the draft parameter, as above, to type the producer's parameters and result.

## Drafts that you finalize later [#drafts-that-you-finalize-later]

`create(base, options?)` returns a draft of the base state and a `finalize()` function, for changes that do not fit in one recipe, such as changes spread over several functions. `finalize()` returns what `create()` returns with a recipe:

```ts
import { create } from 'mutative';

const baseState = {
  foobar: { foo: 'str', bar: 'str' },
  baz: { text: 'str' },
};

const [draft, finalize] = create(baseState, { enablePatches: true });

draft.foobar.bar = 'baz';

const [state, patches, inversePatches] = finalize();

expect(state).toEqual({
  foobar: { foo: 'str', bar: 'baz' },
  baz: { text: 'str' },
});
expect(state.baz).toBe(baseState.baz);
expect(patches).toEqual([
  { op: 'replace', path: ['foobar', 'bar'], value: 'baz' },
]);
expect(inversePatches).toEqual([
  { op: 'replace', path: ['foobar', 'bar'], value: 'str' },
]);
```

The base state must be draftable here, since no recipe returns a value instead.

<Callout type="warn">
  Call `finalize()` only once. When it throws, for example because a development build rejects a patch path, the drafts are not revoked as they are when a recipe fails: they stay writable, and a second `finalize()` returns a state that can hold a revoked draft, with patches that miss changes. Create a new draft from the base state instead.
</Callout>

The `create()` function of [`makeCreator()`](/docs/api-reference/makecreator) has the same forms, with its default options.
