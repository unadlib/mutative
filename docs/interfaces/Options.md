[mutative](../README.md) / Options

# Interface: Options<O, F\>

## Type parameters

| Name | Type |
| :------ | :------ |
| `O` | extends `PatchesOptions` |
| `F` | extends `boolean` |

## Table of contents

### Properties

- [enableAutoFreeze](Options.md#enableautofreeze)
- [enablePatches](Options.md#enablepatches)
- [mark](Options.md#mark)
- [strict](Options.md#strict)

## Properties

### enableAutoFreeze

• `Optional` **enableAutoFreeze**: `F`

Enable autoFreeze, and return frozen state.

#### Defined in

[interface.ts:117](https://github.com/unadlib/mutative/blob/5b264a3/src/interface.ts#L117)

___

### enablePatches

• `Optional` **enablePatches**: `O`

Enable patch, and return the patches and inversePatches.

#### Defined in

[interface.ts:113](https://github.com/unadlib/mutative/blob/5b264a3/src/interface.ts#L113)

___

### mark

• `Optional` **mark**: `Mark`<`O`, `F`\>

Set a mark to determine if the object is mutable or if an instance is an immutable.
And it can also return a shallow copy function(AutoFreeze and Patches should both be disabled).

#### Defined in

[interface.ts:122](https://github.com/unadlib/mutative/blob/5b264a3/src/interface.ts#L122)

___

### strict

• `Optional` **strict**: `boolean`

In strict mode, Forbid accessing non-draftable values and forbid returning a non-draft value.

#### Defined in

[interface.ts:109](https://github.com/unadlib/mutative/blob/5b264a3/src/interface.ts#L109)
