[**mutative**](../README.md)

***

[mutative](../README.md) / DraftedObject

# Type Alias: DraftedObject\<T\>

> **DraftedObject**\<`T`\> = `{ -readonly [K in keyof T]: Draft<T[K]> }`

The draft of an object type: writable properties whose values are drafts.

## Type Parameters

### T

`T`
