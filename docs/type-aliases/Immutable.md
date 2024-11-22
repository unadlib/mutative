[**mutative**](../README.md) • **Docs**

***

[mutative](../README.md) / Immutable

# Type Alias: Immutable\<T\>

> **Immutable**\<`T`\>: `T` *extends* `Primitive` \| `AtomicObject` ? `T` : `T` *extends* `IfAvailable`\<`ReadonlyMap`\<infer K, infer V\>\> ? `ImmutableMap`\<`K`, `V`\> : `T` *extends* `IfAvailable`\<`ReadonlySet`\<infer V\>\> ? `ImmutableSet`\<`V`\> : `T` *extends* `WeakReferences` ? `T` : `T` *extends* `object` ? `ImmutableObject`\<`T`\> : `T`

## Type Parameters

• **T**

## Defined in

[interface.ts:164](https://github.com/unadlib/mutative/blob/7129237bc42b8475743ffff427a1f8f85e8e1e51/src/interface.ts#L164)
