[**mutative**](../README.md) • **Docs**

***

[mutative](../README.md) / Draft

# Type Alias: Draft\<T\>

> **Draft**\<`T`\>: `T` *extends* `Primitive` \| `AtomicObject` ? `T` : `T` *extends* `IfAvailable`\<`ReadonlyMap`\<infer K, infer V\>\> ? `DraftedMap`\<`K`, `V`\> : `T` *extends* `IfAvailable`\<`ReadonlySet`\<infer V\>\> ? `DraftedSet`\<`V`\> : `T` *extends* `WeakReferences` ? `T` : `T` *extends* `object` ? `DraftedObject`\<`T`\> : `T`

## Type Parameters

• **T**

## Defined in

[interface.ts:182](https://github.com/unadlib/mutative/blob/7129237bc42b8475743ffff427a1f8f85e8e1e51/src/interface.ts#L182)
