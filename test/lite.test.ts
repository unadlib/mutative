import * as lite from '../src/lite';
import * as mutative from '../src';

const { create, current, makeCreator } = lite;

test('mutative/lite exports the API of mutative without apply()', () => {
  expect(Object.keys(lite).sort()).toEqual(
    Object.keys(mutative)
      .filter((name) => name !== 'apply')
      .sort()
  );
  type State = { count: number };
  // The options of mutative/lite leave out patches.
  expectTypeOf<mutative.Options<false, false>>().toHaveProperty(
    'enablePatches'
  );
  expectTypeOf<lite.Options<false>>().not.toHaveProperty('enablePatches');
  expectTypeOf(
    create({ count: 1 } as State, (draft) => {
      draft.count += 1;
    })
  ).toEqualTypeOf<State>();
});

// `pnpm test:lite` runs these tests with the constants of the lite build;
// `pnpm test` skips them.
describe.runIf(!__MAP_SET__ && !__PATCHES__ && !__ARRAY_METHODS__)(
  'mutative/lite',
  () => {
    const mapSetError =
      "mutative/lite does not draft Maps or Sets: read and change them in recipes of create() from 'mutative'.";
    const patchesError =
      "mutative/lite does not generate patches: use enablePatches with create() from 'mutative'.";

    test('drafts objects and arrays like mutative', () => {
      const base = { a: { b: 1 }, c: { d: 1 }, list: [{ id: 1 }] };
      const state = create(base, (draft) => {
        draft.a.b = 2;
        draft.list.push({ id: 2 });
      });
      expect(state).toEqual({
        a: { b: 2 },
        c: { d: 1 },
        list: [{ id: 1 }, { id: 2 }],
      });
      expect(state.c).toBe(base.c);
      expect(state.list[0]).toBe(base.list[0]);
      expect(base.a.b).toBe(1);
    });

    test('runs array methods through the draft proxy', () => {
      const base = { list: [{ id: 3 }, { id: 1 }, { id: 2 }, { id: 4 }] };
      const expected = structuredClone(base);
      const recipe = (draft: typeof base) => {
        expect(draft.list.shift).toBe(Array.prototype.shift);
        const first = draft.list.shift()!;
        draft.list.unshift({ id: 5 });
        draft.list.splice(1, 1, first);
        draft.list.reverse();
        draft.list.sort((x, y) => x.id - y.id);
        draft.list[0].id = 0;
        expect(draft.list.findIndex((item) => item.id === 4)).toBe(2);
      };
      recipe(expected);
      const state = create(base, recipe);
      expect(state).toEqual(expected);
      expect(base.list.map((item) => item.id)).toEqual([3, 1, 2, 4]);
    });

    test('throws where it would draft a Map or Set', () => {
      const base = { map: new Map([['k', { v: 1 }]]), set: new Set([1]) };
      expect(() =>
        create(base, (draft) => {
          draft.map.get('k')!.v = 2;
        })
      ).toThrow(mapSetError);
      expect(() =>
        create(base, (draft) => {
          draft.set.add(2);
        })
      ).toThrow(mapSetError);
      expect(() => create(new Map(), () => {})).toThrow(mapSetError);
      expect(() => create(new Set())).toThrow(mapSetError);
    });

    test('keeps Maps and Sets as values', () => {
      const base = {
        map: new Map([['k', 1]]),
        item: { v: 1 },
        list: [] as unknown[],
      };
      const state = create(base, (draft) => {
        draft.item.v = 2;
        // A new Map that holds a draft gets its final value.
        draft.list.push(new Map([['item', draft.item]]));
        expect(
          (current(draft).list[0] as Map<string, unknown>).get('item')
        ).toEqual({ v: 2 });
      });
      expect(state.map).toBe(base.map);
      expect((state.list[0] as Map<string, unknown>).get('item')).toBe(
        state.item
      );
      const frozen = create(
        base,
        (draft) => {
          draft.item.v = 3;
        },
        { enableAutoFreeze: true }
      );
      expect(Object.isFrozen(frozen.map)).toBe(true);
      expect(() => (frozen.map as Map<string, number>).set('j', 2)).toThrow(
        'Cannot modify frozen object'
      );
    });

    test('throws for patches', () => {
      const base = { count: 1 };
      for (const enablePatches of [true, {}, { pathAsArray: false }]) {
        expect(() =>
          create(
            base,
            (draft) => {
              draft.count += 1;
            },
            { enablePatches } as lite.Options<false>
          )
        ).toThrow(patchesError);
      }
      const creator = makeCreator({
        enablePatches: true,
      } as lite.Options<false>);
      expect(() => creator(base, () => {})).toThrow(patchesError);
    });

    test('production builds throw the codes 22 and 23', () => {
      globalThis.__DEV__ = false;
      try {
        expect(() =>
          create({ map: new Map() }, (draft) => {
            expect(draft.map).toBeUndefined();
          })
        ).toThrow(
          'Minified Mutative error #22; visit https://mutative.js.org/docs/extra-topics/errors'
        );
        expect(() =>
          create({}, () => {}, { enablePatches: true } as lite.Options<false>)
        ).toThrow(
          'Minified Mutative error #23; visit https://mutative.js.org/docs/extra-topics/errors'
        );
      } finally {
        globalThis.__DEV__ = true;
      }
    });
  }
);
