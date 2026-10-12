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

Enable autoFreeze, and return frozen state.

***

### enablePatches?

> `optional` **enablePatches**: `O`

Enable patch, and return the patches and inversePatches.

***

### mark?

> `optional` **mark**: `Mark`\<`O`, `F`\> \| `Mark`\<`O`, `F`\>[]

Set a mark to determine if the object is mutable or if an instance is an immutable.
And it can also return a shallow copy function(AutoFreeze and Patches should both be disabled).

***

### strict?

> `optional` **strict**: `boolean`

In strict mode, reading an object that cannot be drafted from a draft,
such as a class instance that no mark makes draftable, or a value that
`mark` makes mutable, throws unless the read happens inside `unsafe()`.
A value returned with `rawReturn()` is still searched for drafts, which
development builds report with a warning. Development builds also warn
once when a recipe leaves 1,000 or more drafts unchanged.
