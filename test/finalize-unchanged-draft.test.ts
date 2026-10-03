import { apply, create } from '../src';

// Reading a child creates the parent's shallow copy without changing it. The
// finalized state keeps the original for such a draft, and so must a Set that
// received the draft, whatever the order in which the drafts were created.
describe('unchanged drafts added to a Set finalize to their original', () => {
  test.each([
    [
      'array child read first',
      (draft: any) => {
        expect(draft.array[0].value).toBe(1);
        draft.refs.add(draft.array);
      },
    ],
    [
      'Set read first',
      (draft: any) => {
        expect(draft.refs.size).toBe(0);
        expect(draft.array[0].value).toBe(1);
        draft.refs.add(draft.array);
      },
    ],
  ])('%s', (_name, recipe) => {
    const base = { array: [{ value: 1 }], refs: new Set<object>() };
    const state = create(base, (draft) => {
      recipe(draft);
    });
    expect(state.array).toBe(base.array);
    expect([...state.refs][0]).toBe(state.array);
    expect(base.refs.size).toBe(0);
  });

  test('plain object children behave the same', () => {
    const base = { object: { inner: { value: 1 } }, refs: new Set<object>() };
    const state = create(base, (draft) => {
      const object = draft.object;
      expect(object.inner.value).toBe(1);
      draft.refs.add(object);
    });
    expect(state.object).toBe(base.object);
    expect([...state.refs][0]).toBe(state.object);
  });

  test('a changed draft is finalized into the Set as the new value', () => {
    const base = { array: [{ value: 1 }], refs: new Set<object>() };
    const [state, patches, inverse] = create(
      base,
      (draft) => {
        const array = draft.array;
        draft.refs.add(array);
        array[0].value = 2;
      },
      { enablePatches: true }
    );
    expect(state.array).not.toBe(base.array);
    expect(state.array).toEqual([{ value: 2 }]);
    expect([...state.refs][0]).toBe(state.array);
    expect(apply(base, patches)).toEqual(state);
    expect(apply(state, inverse)).toEqual(base);
  });
});
