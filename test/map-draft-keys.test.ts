/* eslint-disable @typescript-eslint/no-explicit-any */
import { apply, create, current, original, rawReturn } from '../src';

const message =
  'A draft cannot be a Map key: its producer revokes it when it ends. Use original(key), current(key) or an id as the key; see https://mutative.js.org/docs/extra-topics/faq';

test.each([{}, { enablePatches: true }, { enableAutoFreeze: true }])(
  'a draft cannot be a Map key (%o)',
  (options) => {
    expect(() =>
      create(
        { key: { id: 1 }, map: new Map<any, string>() },
        (draft) => {
          draft.map.set(draft.key, 'value');
        },
        options
      )
    ).toThrow(message);
  }
);

test('a draft of an outer producer cannot be a Map key', () => {
  expect(() =>
    create({ key: { id: 1 } }, (outer) => {
      create(new Map<any, string>(), (draft) => {
        draft.set(outer.key, 'value');
      });
    })
  ).toThrow(message);
});

describe('a draft as a key of a Map that a recipe returns or assigns', () => {
  const makeBase = () => ({
    key: { id: 1 },
    list: [] as any[],
    set: new Set<any>(),
  });
  const withKey = (draft: any) => new Map([[draft.key, 'value']]);
  test.each<[string, (draft: any) => any, object?]>([
    ['returned', (draft) => withKey(draft)],
    ['returned in an object', (draft) => ({ map: withKey(draft) })],
    ['returned in a Set', (draft) => new Set([withKey(draft)])],
    [
      'returned with rawReturn() in strict mode',
      (draft) => rawReturn(withKey(draft)),
      { strict: true },
    ],
    [
      'returned frozen with auto-freeze',
      (draft) => Object.freeze(withKey(draft)),
      { enableAutoFreeze: true },
    ],
    [
      'assigned',
      (draft) => {
        draft.map = withKey(draft);
      },
    ],
    [
      'pushed in an object',
      (draft) => {
        draft.list.push({ map: withKey(draft) });
      },
    ],
    [
      'added to a Set draft',
      (draft) => {
        draft.set.add(withKey(draft));
      },
    ],
  ])('is rejected when the Map is %s', (_, recipe, options = {}) => {
    expect(() => create(makeBase(), recipe, options as any)).toThrow(message);
  });

  test('is rejected for a draft of an outer producer', () => {
    expect(() =>
      create(makeBase(), (outer) => {
        create({}, (): any => withKey(outer));
      })
    ).toThrow(message);
  });

  test('is not needed for the original of a draft or an id', () => {
    const base = makeBase();
    const state: any = create(base, (draft): any => ({
      map: new Map<any, any>([
        [original(draft.key), draft.list],
        [draft.key.id, draft.key],
      ]),
    }));
    expect([...state.map.keys()]).toEqual([base.key, 1]);
    // Drafts that values hold are replaced as before.
    expect(state.map.get(base.key)).toBe(base.list);
    expect(state.map.get(1)).toBe(base.key);
  });
});

test('the original or a snapshot of a draft can be a Map key', () => {
  const base = { key: { id: 1 }, map: new Map<any, string>() };
  const state = create(base, (draft) => {
    draft.map.set(original(draft.key), 'original');
    draft.key.id = 2;
    draft.map.set(current(draft.key), 'current');
  });
  expect(state.map.get(base.key)).toBe('original');
  expect([...state.map.keys()]).toEqual([{ id: 1 }, { id: 2 }]);
  expect(state.key).toEqual({ id: 2 });
});

test('a key whose properties cannot be read is no draft', () => {
  const opaque = new Proxy(
    {},
    {
      get() {
        throw new Error('opaque key');
      },
    }
  );
  const { proxy: revoked, revoke } = Proxy.revocable({}, {});
  revoke();
  for (const key of [opaque, revoked]) {
    const added = create(new Map<any, number>(), (draft) => {
      draft.set(key, 1);
    });
    expect(added.get(key)).toBe(1);
    const updated = create(added, (draft) => {
      draft.set(key, 2);
    });
    expect(updated.get(key)).toBe(2);
    const same = create(updated, (draft) => {
      draft.set(key, 2);
    });
    expect(same).toBe(updated);
    const applied = apply(updated, [
      { op: 'replace', path: [key as any], value: 3 },
    ]);
    expect(applied.get(key)).toBe(3);
  }
});
