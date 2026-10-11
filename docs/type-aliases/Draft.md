[**mutative**](../README.md)

***

[mutative](../README.md) / Draft

# Type Alias: Draft\<T\>

> **Draft**\<`T`\> = `T` *extends* `Primitive` \| `AtomicObject` ? `T` : `T` *extends* `IfAvailable`\<`ReadonlyMap`\<infer K, infer V\>\> ? `DraftedMap`\<`K`, `V`\> : `T` *extends* `IfAvailable`\<`ReadonlySet`\<infer V\>\> ? `DraftedSet`\<`V`\> : `T` *extends* `WeakReferences` ? `T` : `T` *extends* `object` ? [`DraftedObject`](DraftedObject.md)\<`T`\> : `T`

Defined in: [interface.ts:229](https://github.com/unadlib/mutative/blob/8667c30c96a236a80844257728eb46826ca6f5d8/src/interface.ts#L229)

## Type Parameters

### T

`T`
