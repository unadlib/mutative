import { apply, create } from '../src';

const shape = (array: unknown[]) => ({
  length: array.length,
  own: Array.from(array, (_value, index) => index in array),
});

// Assigning `undefined` to a key that the copy no longer has is a change,
// even when the original still has that key. Plain JS is the reference.
describe('assigning undefined to a removed key', () => {
  test('restores an array index removed by shift and unshift', () => {
    const expected: unknown[] = [0, 0, undefined];
    expected.shift();
    expected.unshift(2);
    const base: unknown[] = [0, 0, undefined];
    const [state, patches, inverse] = create(
      base,
      (draft) => {
        draft.shift();
        draft.unshift(2);
      },
      { enablePatches: true }
    );
    expect(shape(state)).toStrictEqual(shape(expected));
    expect(state).toStrictEqual(expected);
    expect(shape(apply(base, patches))).toStrictEqual(shape(state));
    expect(apply(state, inverse)).toStrictEqual(base);
  });

  test('extends an array shortened by splice', () => {
    const base: unknown[] = [0, 0, undefined];
    const state = create(base, (draft) => {
      draft.splice(2, 1);
      draft[2] = undefined;
    });
    expect(shape(state)).toStrictEqual({ length: 3, own: [true, true, true] });
    expect(state).toStrictEqual([0, 0, undefined]);
  });

  test('re-adds a deleted object key', () => {
    const base: { x?: number; y: number } = { x: 1, y: 2 };
    const [state, patches, inverse] = create(
      base,
      (draft) => {
        delete draft.x;
        draft.x = undefined;
      },
      { enablePatches: true }
    );
    expect('x' in state).toBe(true);
    expect(state).toStrictEqual({ x: undefined, y: 2 });
    const replayed = apply(base, patches);
    expect('x' in replayed).toBe(true);
    expect(replayed).toStrictEqual(state);
    expect(apply(state, inverse)).toStrictEqual(base);
  });

  test('still treats an existing undefined value as unchanged', () => {
    const base = { x: undefined, list: [undefined] as unknown[] };
    const state = create(base, (draft) => {
      draft.x = undefined;
      draft.list[0] = undefined;
    });
    expect(state).toBe(base);
  });
});
