/* eslint-disable @typescript-eslint/no-explicit-any */
import { create, current, original } from '../src';

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
