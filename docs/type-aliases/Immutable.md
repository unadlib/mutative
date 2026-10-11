[**mutative**](../README.md)

***

[mutative](../README.md) / Immutable

# Type Alias: Immutable\<T\>

> **Immutable**\<`T`\> = `T` *extends* `Primitive` \| `AtomicObject` ? `T` : `T` *extends* `IfAvailable`\<`ReadonlyMap`\<infer K, infer V\>\> ? `ImmutableMap`\<`K`, `V`\> : `T` *extends* `IfAvailable`\<`ReadonlySet`\<infer V\>\> ? `ImmutableSet`\<`V`\> : `T` *extends* `WeakReferences` ? `T` : `T` *extends* `object` ? `ImmutableObject`\<`T`\> : `T`

Defined in: [interface.ts:211](https://github.com/unadlib/mutative/blob/cbcd06102ce38252b6fa8b2c9f28a18ba9d9fbe9/src/interface.ts#L211)

## Type Parameters

### T

`T`
