/* eslint-disable @typescript-eslint/no-explicit-any */
import { apply, create, current, original } from '../src';

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
