mutative / [Exports](modules.md)

# mutative

![Node CI](https://github.com/unadlib/mutative/workflows/Node%20CI/badge.svg)
[![npm](https://img.shields.io/npm/v/mutative.svg)](https://www.npmjs.com/package/mutative)

Efficient creation of immutable state

## APIs

- `create()`

```ts
const initState = {
  foo: 'bar',
  list: [{ id: '0', text: 'todo' }],
};

const { state } = create(initState, (draft) => {
  //
});
```
