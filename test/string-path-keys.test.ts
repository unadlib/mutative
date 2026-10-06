/* eslint-disable @typescript-eslint/no-explicit-any */
import { apply, create } from '../src';

const stringPaths = { enablePatches: { pathAsArray: false } } as const;
const error =
  'Patches with string paths only support string Map keys and no symbol keys, got a key of type';

describe('string patch paths', () => {
  test('keep string Map keys, escaped, and replay them', () => {
    const base = new Map<string, any>([
      ['a/b', 1],
      ['~c', { v: 1 }],
      ['d', 1],
    ]);
    const [state, patches, inversePatches] = create(
      base,
      (draft) => {
        draft.set('a/b', 2);
        draft.get('~c').v = 2;
        draft.delete('d');
        draft.set('e', 3);
      },
      stringPaths
    );
    expect(patches.map(({ path }) => path)).toStrictEqual([
      '/~0c/v',
      '/a~1b',
      '/d',
      '/e',
    ]);
    expect([...apply(base, patches)]).toStrictEqual([...state]);
    expect([...apply(state, inversePatches)]).toStrictEqual([...base]);
  });

  test('reject Map keys that are not strings', () => {
    const arrayKey = ['k'];
    const objectKey = { id: 1 };
    for (const [key, type] of [
      [1, 'number'],
      [true, 'boolean'],
      [arrayKey, 'object'],
      [objectKey, 'object'],
      [Symbol('s'), 'symbol'],
      [null, 'object'],
      [undefined, 'undefined'],
    ] as [any, string][]) {
      expect(() =>
        create(
          new Map([[key, 1]]),
          (draft) => {
            draft.set(key, 2);
          },
          stringPaths
        )
      ).toThrow(`${error} '${type}'`);
      expect(() =>
        create(
          new Map([[key, 1]]),
          (draft) => {
            draft.delete(key);
          },
          stringPaths
        )
      ).toThrow(`${error} '${type}'`);
    }
  });

  test('reject a changed value under a Map key that is not a string', () => {
    expect(() =>
      create(
        { map: new Map([[1, { v: 1 }]]) },
        (draft) => {
          draft.map.get(1)!.v = 2;
        },
        stringPaths
      )
    ).toThrow(`${error} 'number'`);
  });

  test('reject symbol keys of objects', () => {
    const key = Symbol('s');
    expect(() =>
      create(
        {} as any,
        (draft) => {
          draft[key] = 1;
        },
        stringPaths
      )
    ).toThrow(`${error} 'symbol'`);
    expect(() =>
      create(
        { [key]: { v: 1 } } as any,
        (draft) => {
          draft[key].v = 2;
        },
        stringPaths
      )
    ).toThrow(`${error} 'symbol'`);
  });

  test('revoke the drafts of the failed producer', () => {
    let captured: any;
    expect(() =>
      create(
        { map: new Map([[1, { v: 1 }]]) },
        (draft) => {
          captured = draft;
          draft.map.get(1)!.v = 2;
        },
        stringPaths
      )
    ).toThrow(error);
    expect(() => captured.map).toThrow();
  });

  test('leave producers without patches for such keys unchanged', () => {
    const key = Symbol('s');
    const base = { map: new Map<any, any>([[1, { v: 1 }]]), [key]: 1 } as any;
    // Unchanged keys of other types, and recipes without patches.
    const [state, patches] = create(
      base,
      (draft) => {
        draft.other = 1;
      },
      stringPaths
    );
    expect(patches).toStrictEqual([{ op: 'add', path: '/other', value: 1 }]);
    expect(state.map).toBe(base.map);
    const next = create(base, (draft) => {
      draft.map.get(1).v = 2;
      draft[key] = 2;
    });
    expect(next.map.get(1)).toStrictEqual({ v: 2 });
    expect(next[key]).toBe(2);
  });

  test('accept changes under such keys once their container left its key', () => {
    const key = Symbol('s');
    // The patches of the container's parent carry its value, so no patch
    // path holds the key.
    const recipes: [any, (draft: any) => void][] = [
      [
        { a: new Map([[1, { v: 1 }]]) },
        (draft) => {
          draft.a.get(1).v = 2;
          draft.b = draft.a;
          delete draft.a;
        },
      ],
      [
        { a: new Map([[1, { v: 1 }]]) },
        (draft) => {
          draft.a.get(1).v = 2;
          delete draft.a;
        },
      ],
      [
        { a: new Map([[1, { v: 1 }]]) },
        (draft) => {
          draft.a.get(1).v = 2;
          draft.a = new Map();
        },
      ],
      [
        { list: [new Map([[1, { v: 1 }]]), new Map()] },
        (draft) => {
          draft.list[0].get(1).v = 2;
          draft.list.reverse();
        },
      ],
      [
        { a: { [key]: { v: 1 } } },
        (draft) => {
          draft.a[key].v = 2;
          draft.b = draft.a;
          delete draft.a;
        },
      ],
    ];
    for (const [base, recipe] of recipes) {
      const [state, patches, inversePatches] = create(
        base,
        recipe,
        stringPaths
      );
      expect(apply(base, patches)).toStrictEqual(state);
      expect(apply(state, inversePatches)).toStrictEqual(base);
    }
  });

  test('array paths keep keys of every type', () => {
    const key = Symbol('s');
    const objectKey = { id: 1 };
    const base = {
      map: new Map<any, any>([
        [1, { v: 1 }],
        [objectKey, 1],
      ]),
      [key]: 1,
    } as any;
    const [state, patches, inversePatches] = create(
      base,
      (draft) => {
        draft.map.get(1).v = 2;
        draft.map.set(objectKey, 2);
        draft[key] = 2;
      },
      { enablePatches: true }
    );
    const replayed = apply(base, patches);
    expect([...replayed.map]).toStrictEqual([...state.map]);
    expect(replayed.map.get(objectKey)).toBe(2);
    expect(replayed[key]).toBe(2);
    const undone = apply(state, inversePatches);
    expect(undone.map.get(1)).toStrictEqual({ v: 1 });
    expect(undone.map.get(objectKey)).toBe(1);
    expect(undone[key]).toBe(1);
  });
});
