[**mutative**](../README.md)

***

[mutative](../README.md) / makeCreator

# Variable: makeCreator

> `const` **makeCreator**: `MakeCreator`

Defined in: [makeCreator.ts:173](https://github.com/unadlib/mutative/blob/080a20500efdd03828f63d0f023fc6d7458b3e98/src/makeCreator.ts#L173)

`makeCreator(options)` to make a creator function.

## Example

```ts
import { makeCreator } from '../index';

const baseState = { foo: { bar: 'str' }, arr: [] };
const create = makeCreator({ enableAutoFreeze: true });
const state = create(
  baseState,
  (draft) => {
    draft.foo.bar = 'str2';
  },
);

expect(state).toEqual({ foo: { bar: 'str2' }, arr: [] });
expect(state).not.toBe(baseState);
expect(state.foo).not.toBe(baseState.foo);
expect(state.arr).toBe(baseState.arr);
expect(Object.isFrozen(state)).toBeTruthy();
```
