# Auto Freeze (/docs/advanced-guides/auto-freeze)

Freeze the next state deeply with enableAutoFreeze, so that accidental changes to it fail.

Mutative leaves the next state unfrozen by default. With the `enableAutoFreeze` option, it freezes the next state deeply with `Object.freeze()`, so that code that changes the state by accident fails instead of changing a state that other code still uses.

## Enable auto-freeze [#enable-auto-freeze]

```ts
import { create } from 'mutative';

const baseState = { user: { name: 'Ada' }, tags: ['a'] };

const state = create(
  baseState,
  (draft) => {
    draft.user.name = 'Grace';
  },
  {
    enableAutoFreeze: true,
  }
);

expect(Object.isFrozen(state)).toBe(true);
expect(Object.isFrozen(state.user)).toBe(true);
// The array that the next state shares with the base state is frozen too.
expect(state.tags).toBe(baseState.tags);
expect(Object.isFrozen(baseState.tags)).toBe(true);

// Writing to it throws in strict mode code, such as an ES module.
expect(() => {
  'use strict';
  (state.user as { name: string }).name = 'Linus';
}).toThrow(TypeError);
```

Set it for a whole application with [`makeCreator()`](/docs/api-reference/makecreator), and pass it to [`apply()`](/docs/api-reference/apply) to freeze the states that patches produce.

## What is frozen [#what-is-frozen]

* Every object of the next state that its enumerable keys reach: the copies of the objects that the recipe changed, the values that it assigned, and the objects that the next state shares with the base state, which are frozen in the base state as well. A recipe that changes nothing returns the base state itself, frozen.
* Class instances, dates and functions, which `Object.freeze()` freezes like any object. A `Date` keeps its setters, such as `setFullYear()`, since its value is not a property.
* Maps and Sets, whose `set()`, `add()`, `delete()` and `clear()` methods then throw, and the objects that a Map uses as keys.

Objects that are already frozen are skipped together with the values they hold, so after the first update freezes the state, each later update freezes only the objects that it copied or added. A base state may be frozen already: Mutative copies frozen objects when a recipe changes them, as it copies any other object.

Writing to a frozen object throws a `TypeError` in strict mode code, which includes ES modules and classes, and does nothing elsewhere. A frozen Map or Set throws in either case.

## Development checks [#development-checks]

Development builds throw for a next state that holds a circular reference, an object that holds itself through its values, which Mutative does not support; see [Shared references](/docs/extra-topics/shared-references). Production builds skip this check.

With auto-freeze, production builds also skip frozen objects when they search a [returned value](/docs/api-reference/rawreturn) for drafts, so returning an earlier, frozen state costs little. Development builds still search them and throw when they find a draft there.

## Cost and recommendation [#cost-and-recommendation]

Freezing visits every object that is not frozen yet, so it costs time on every update, most of all for states that change wide objects or large arrays. In the [benchmark](/docs/getting-started/performance), Immer, which freezes by default, took longer with auto-freeze than without it in most of the selected workloads, and Mutative's defaults leave it off.

<Callout type="idea">
  Enable auto-freeze in development to catch accidental changes to the state, and leave it off in production for speed: `makeCreator({ enableAutoFreeze: process.env.NODE_ENV !== 'production' })`. Keep it on in production if other code relies on a frozen state.
</Callout>

A [mark](/docs/advanced-guides/mark) that returns a custom shallow copy function cannot be combined with auto-freeze. [`current()`](/docs/api-reference/current) returns unfrozen snapshots, also with auto-freeze, and TypeScript types the result of `create()` with `enableAutoFreeze: true` as `Immutable<State>`, whose properties are `readonly`.
