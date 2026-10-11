[**mutative**](../README.md)

***

[mutative](../README.md) / Options

# Interface: Options\<O, F\>

Defined in: [interface.ts:171](https://github.com/unadlib/mutative/blob/8667c30c96a236a80844257728eb46826ca6f5d8/src/interface.ts#L171)

## Type Parameters

### O

`O` *extends* [`PatchesOptions`](../type-aliases/PatchesOptions.md)

### F

`F` *extends* `boolean`

## Properties

### enableAutoFreeze?

> `optional` **enableAutoFreeze**: `F`

Defined in: [interface.ts:184](https://github.com/unadlib/mutative/blob/8667c30c96a236a80844257728eb46826ca6f5d8/src/interface.ts#L184)

Enable autoFreeze, and return frozen state.

***

### enablePatches?

> `optional` **enablePatches**: `O`

Defined in: [interface.ts:180](https://github.com/unadlib/mutative/blob/8667c30c96a236a80844257728eb46826ca6f5d8/src/interface.ts#L180)

Enable patch, and return the patches and inversePatches.

***

### mark?

> `optional` **mark**: `Mark`\<`O`, `F`\> \| `Mark`\<`O`, `F`\>[]

Defined in: [interface.ts:189](https://github.com/unadlib/mutative/blob/8667c30c96a236a80844257728eb46826ca6f5d8/src/interface.ts#L189)

Set a mark to determine if the object is mutable or if an instance is an immutable.
And it can also return a shallow copy function(AutoFreeze and Patches should both be disabled).

***

### strict?

> `optional` **strict**: `boolean`

Defined in: [interface.ts:176](https://github.com/unadlib/mutative/blob/8667c30c96a236a80844257728eb46826ca6f5d8/src/interface.ts#L176)

In strict mode, Forbid accessing non-draftable values and forbid returning a non-draft value.
Development builds also warn once when a recipe leaves 1,000 or more drafts unchanged.
