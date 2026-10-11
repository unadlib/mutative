[**mutative**](../README.md)

***

[mutative](../README.md) / Immutable

# Type Alias: Immutable\<T\>

> **Immutable**\<`T`\> = `T` *extends* `Primitive` \| `AtomicObject` ? `T` : `T` *extends* `IfAvailable`\<`ReadonlyMap`\<infer K, infer V\>\> ? `ImmutableMap`\<`K`, `V`\> : `T` *extends* `IfAvailable`\<`ReadonlySet`\<infer V\>\> ? `ImmutableSet`\<`V`\> : `T` *extends* `WeakReferences` ? `T` : `T` *extends* `object` ? `ImmutableObject`\<`T`\> : `T`

Defined in: [interface.ts:211](https://github.com/unadlib/mutative/blob/8667c30c96a236a80844257728eb46826ca6f5d8/src/interface.ts#L211)

## Type Parameters

### T

`T`
