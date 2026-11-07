[**mutative**](../README.md)

***

[mutative](../README.md) / compactArrayPatches

# Variable: compactArrayPatches

> `const` **compactArrayPatches**: [`ArrayPatchStrategy`](../interfaces/ArrayPatchStrategy.md)

The value of the `arrayPatchStrategy` option that keeps array elements which
stay in order out of patches: removing the first of 10,000 elements takes one
patch instead of 10,000, and `draft.list = draft.list.filter(...)` a patch per
removed element instead of the whole array. An array is left to the default
patches where those are about as small. Bundlers drop this value unless it is
imported.

## Example

```ts
import { compactArrayPatches, create } from 'mutative';

const [state, patches, inversePatches] = create(
  { list: [1, 2, 3, 4] },
  (draft) => {
    draft.list.splice(1, 1);
  },
  { enablePatches: { arrayPatchStrategy: compactArrayPatches } }
);

expect(patches).toEqual([{ op: 'remove', path: ['list', 1] }]);
expect(inversePatches).toEqual([{ op: 'add', path: ['list', 1], value: 2 }]);
```
