[**mutative**](../README.md)

***

[mutative](../README.md) / Draft

# Type Alias: Draft\<T\>

> **Draft**\<`T`\> = `T` *extends* `Primitive` \| `AtomicObject` ? `T` : `T` *extends* `IfAvailable`\<`ReadonlyMap`\<infer K, infer V\>\> ? `DraftedMap`\<`K`, `V`\> : `T` *extends* `IfAvailable`\<`ReadonlySet`\<infer V\>\> ? `DraftedSet`\<`V`\> : `T` *extends* `WeakReferences` ? `T` : `T` *extends* `object` ? [`DraftedObject`](DraftedObject.md)\<`T`\> : `T`

The type of a draft of `T`: its objects, arrays, Maps and Sets without
`readonly`, deeply, so that a recipe can change them. Functions, Promises,
dates and regular expressions keep their types.

## Type Parameters

### T

`T`
