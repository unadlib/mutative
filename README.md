# mutative

Efficient creation of immutable state

## APIs

- `create()`

```ts
const initState = {
  foo: 'bar',
  list: [{ id: '0', text: 'todo' }]
};

const { state } = create(initState, (draft) => {
  //
})
```
### Features

- Performance
- Use Cache
- Only support proxy
- Minimized patch
- Apply patches consistency
