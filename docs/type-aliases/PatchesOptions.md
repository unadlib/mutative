[**mutative**](../README.md)

***

[mutative](../README.md) / PatchesOptions

# Type Alias: PatchesOptions

> **PatchesOptions** = `boolean` \| \{ `arrayLengthAssignment?`: `boolean`; `arrayPatchStrategy?`: `"index"` \| `"compact"`; `pathAsArray?`: `boolean`; \}

The `enablePatches` option: `true` or an object generates patches, `false`
does not.

## Type Declaration

`boolean`

\{ `arrayLengthAssignment?`: `boolean`; `arrayPatchStrategy?`: `"index"` \| `"compact"`; `pathAsArray?`: `boolean`; \}

### arrayLengthAssignment?

> `optional` **arrayLengthAssignment**: `boolean`

Whether an array that gets shorter gets a `replace` patch of its
`length`, as by default, or a `remove` patch for each index that it
loses, as JSON Patch requires.

### arrayPatchStrategy?

> `optional` **arrayPatchStrategy**: `"index"` \| `"compact"`

How to represent array changes. The default `'index'` compares the
values at each index. `'compact'` expresses one contiguous, non-tail
insertion or deletion as `add` or `remove` patches when all retained
elements are unchanged, and otherwise falls back to `'index'`.

Both strategies generate value-based patches. Compact patches do not
record the recipe's operations or preserve JavaScript object aliases.

#### Default

```ts
'index'
```

### pathAsArray?

> `optional` **pathAsArray**: `boolean`

Whether a patch path is an array of keys, as by default, or a JSON
Pointer string, such as `/list/0`.
