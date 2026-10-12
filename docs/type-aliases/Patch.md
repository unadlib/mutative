[**mutative**](../README.md)

***

[mutative](../README.md) / Patch

# Type Alias: Patch\<P\>

> **Patch**\<`P`\> = `P` *extends* `object` ? `IPatch` & `object` : `P` *extends* `true` \| `object` ? `IPatch` & `object` : `IPatch` & `object`

An `add`, `remove` or `replace` operation at a path, as `create()` generates
it with `enablePatches` and `apply()` applies it. The path is an array of
keys, or a JSON Pointer string with `pathAsArray: false`.

## Type Parameters

### P

`P` *extends* [`PatchesOptions`](PatchesOptions.md) = `any`
