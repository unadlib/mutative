[**mutative**](../README.md) • **Docs**

***

[mutative](../README.md) / Options

# Interface: Options\<O, F\>

## Type Parameters

• **O** *extends* [`PatchesOptions`](../type-aliases/PatchesOptions.md)

• **F** *extends* `boolean`

## Properties

### enableAutoFreeze?

> `optional` **enableAutoFreeze**: `F`

Enable autoFreeze, and return frozen state.

#### Defined in

[interface.ts:137](https://github.com/unadlib/mutative/blob/4e5a64df3bd670123a9179420fc5820dbbf11915/src/interface.ts#L137)

***

### enablePatches?

> `optional` **enablePatches**: `O`

Enable patch, and return the patches and inversePatches.

#### Defined in

[interface.ts:133](https://github.com/unadlib/mutative/blob/4e5a64df3bd670123a9179420fc5820dbbf11915/src/interface.ts#L133)

***

### mark?

> `optional` **mark**: `Mark`\<`O`, `F`\> \| `Mark`\<`O`, `F`\>[]

Set a mark to determine if the object is mutable or if an instance is an immutable.
And it can also return a shallow copy function(AutoFreeze and Patches should both be disabled).

#### Defined in

[interface.ts:142](https://github.com/unadlib/mutative/blob/4e5a64df3bd670123a9179420fc5820dbbf11915/src/interface.ts#L142)

***

### strict?

> `optional` **strict**: `boolean`

In strict mode, Forbid accessing non-draftable values and forbid returning a non-draft value.

#### Defined in

[interface.ts:129](https://github.com/unadlib/mutative/blob/4e5a64df3bd670123a9179420fc5820dbbf11915/src/interface.ts#L129)
