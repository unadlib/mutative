[**mutative**](../README.md)

***

[mutative](../README.md) / Options

# Interface: Options\<O, F\>

## Type Parameters

### O

`O` *extends* [`PatchesOptions`](../type-aliases/PatchesOptions.md)

### F

`F` *extends* `boolean`

## Properties

### enableAutoFreeze?

> `optional` **enableAutoFreeze**: `F`

Freeze the next state deeply, also the parts that it shares with the base
state. Development builds also throw for an object that holds itself.

***

### enablePatches?

> `optional` **enablePatches**: `O`

Generate patches: the result is then
`[state, patches, inversePatches]`.

***

### mark?

> `optional` **mark**: `Mark`\<`O`, `F`\> \| `Mark`\<`O`, `F`\>[]

Decide how values are drafted: a mark returns `immutable` to make a value
draftable, such as a class instance, `mutable` to keep it out of drafts so
that the recipe changes it in place, or a function that returns a shallow
copy of the value, which needs patches and auto-freeze off. With several
marks, the first one that returns a value decides.

***

### strict?

> `optional` **strict**: `boolean`

In strict mode, reading an object that cannot be drafted from a draft,
such as a class instance that no mark makes draftable, or a value that
`mark` makes mutable, throws unless the read happens inside `unsafe()`.
A value returned with `rawReturn()` is still searched for drafts, which
development builds report with a warning. Development builds also warn
once when a recipe leaves 1,000 or more drafts unchanged.
