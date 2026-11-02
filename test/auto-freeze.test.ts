/* eslint-disable @typescript-eslint/no-explicit-any */
// Which values auto-freeze freezes, in development and production builds.
import { vi } from 'vitest';

class Point {
  x = 0;
  nested = { y: 0 };
}

class Holder {
  constructor(public item: any) {}
}

const mutables = new WeakSet<object>();
const markedMutable = <T extends object>(value: T) => {
  mutables.add(value);
  return value;
};
const marks = {
  immutable: (value: any, types: any) =>
    value instanceof Point ? types.immutable : undefined,
  copy: (value: any) =>
    value instanceof Point
      ? () => Object.assign(new Point(), value)
      : undefined,
  mutable: (value: any, types: any) =>
    typeof value === 'object' && value !== null && mutables.has(value)
      ? types.mutable
      : undefined,
};

type Case = [
  description: string,
  make: () => any,
  frozen: { development: boolean; production: boolean },
  options?: {
    mark?: (value: any, types: any) => any;
    at?: (value: any) => any;
  },
];

const both = (frozen: boolean) => ({ development: frozen, production: frozen });

const cases: Case[] = [
  ['a plain object', () => ({ a: 1 }), both(true)],
  ['an array', () => [1], both(true)],
  ['a Map', () => new Map([[1, 1]]), both(true)],
  ['a Set', () => new Set([1]), both(true)],
  ['a class instance', () => new Point(), both(true)],
  [
    'a plain object that a class instance holds',
    () => new Point(),
    both(true),
    { at: (point) => point.nested },
  ],
  ['a null-prototype object', () => Object.create(null), both(true)],
  ['a date', () => new Date(0), both(true)],
  ['a regular expression', () => /a/g, both(true)],
  ['a function', () => () => 1, { development: true, production: false }],
  ['a typed array', () => new Uint8Array(1), both(false)],
  [
    'a class instance marked immutable',
    () => new Point(),
    both(true),
    { mark: marks.immutable },
  ],
  [
    'a class instance marked with a shallow copy',
    () => new Point(),
    both(true),
    { mark: marks.copy },
  ],
  [
    'a plain object marked mutable',
    () => markedMutable({ a: 1 }),
    both(true),
    { mark: marks.mutable },
  ],
  [
    'a class instance marked mutable',
    () => markedMutable(new Point()),
    both(true),
    { mark: marks.mutable },
  ],
];

for (const dev of [true, false]) {
  const build = dev ? 'development' : 'production';
  describe(`auto-freeze, ${build}`, () => {
    let mutative: typeof import('../src');
    beforeAll(async () => {
      vi.resetModules();
      globalThis.__DEV__ = dev;
      mutative = await import('../src');
    });
    afterAll(() => {
      globalThis.__DEV__ = true;
    });

    test.each(cases)(
      '%s, in the base state or assigned by the recipe',
      (_, make, frozen, { mark, at = (value: any) => value } = {}) => {
        const { create } = mutative;
        const options = { enableAutoFreeze: true as const, mark };
        const state: any = create(
          { value: make(), n: 0 },
          (draft) => {
            draft.n += 1;
          },
          options
        );
        expect(Object.isFrozen(at(state.value))).toBe(frozen[build]);
        const assigned = make();
        const next: any = create(
          { n: 0 } as any,
          (draft) => {
            draft.value = assigned;
          },
          options
        );
        expect(next.value).toBe(assigned);
        expect(Object.isFrozen(at(next.value))).toBe(frozen[build]);
      }
    );

    test.each([
      ['a plain object', () => ({ a: 1 }), true],
      ['a class instance', () => new Point(), true],
    ])('%s used as a Map key', (_, make, frozen) => {
      const { create } = mutative;
      const key = make();
      const state = create(
        { map: new Map([[key, 1]]), n: 0 },
        (draft) => {
          draft.n += 1;
        },
        { enableAutoFreeze: true }
      );
      expect([...state.map.keys()][0]).toBe(key);
      expect(Object.isFrozen(key)).toBe(frozen);
    });

    test('a class instance that holds itself', () => {
      const { create } = mutative;
      class Node {
        self = this;
      }
      const update = () =>
        create(
          { node: new Node(), n: 0 },
          (draft) => {
            draft.n += 1;
          },
          { enableAutoFreeze: true }
        );
      if (dev) {
        expect(update).toThrow('Forbids circular reference');
      } else {
        expect(Object.isFrozen(update().node)).toBe(true);
      }
    });

    test('drafts in a class instance of a returned value are replaced', () => {
      const { create } = mutative;
      for (const enableAutoFreeze of [false, true]) {
        const base = { item: { k: 1 } };
        const state: any = create(
          base as any,
          (draft: any) => ({ holder: new Holder(draft.item) }),
          { enableAutoFreeze }
        );
        expect(state.holder.item).toBe(base.item);
      }
    });
  });
}
