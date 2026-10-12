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

In strict mode, Forbid accessing non-draftable values and forbid returning a non-draft value.
Development builds also warn once when a recipe leaves 1,000 or more drafts unchanged.
