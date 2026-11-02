/* eslint-disable @typescript-eslint/no-explicit-any */
// Which values auto-freeze freezes, in development and production builds.
import { vi } from 'vitest';
import { runInNewContext } from 'node:vm';

class Point {
  x = 0;
  nested = { y: 0 };
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
  [
    'a plain object of another realm',
    () => runInNewContext('({ n: 1 })'),
    both(true),
  ],
  ['a date', () => new Date(0), both(true)],
  ['a regular expression', () => /a/g, both(true)],
  ['a function', () => () => 1, { development: true, production: false }],
  [
    'a plain object that a function holds',
    () => Object.assign(() => 1, { nested: { n: 0 } }),
    { development: true, production: false },
    { at: (value) => value.nested },
  ],
  ['a typed array', () => new Uint8Array(1), both(false)],
  [
    'a class instance marked immutable',
    () => new Point(),
    both(true),
    { mark: marks.immutable },
  ],
  [
    'a plain object that a class instance marked immutable holds',
    () => new Point(),
    both(true),
    { mark: marks.immutable, at: (point) => point.nested },
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

test('freezing an unmarked instance does not read its constructor or warn', async () => {
  vi.resetModules();
  globalThis.__DEV__ = true;
  const { create } = await import('../src');
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    const prototype = Object.create(null, {
      constructor: {
        get() {
          throw new Error('The constructor must not be read');
        },
      },
    });
    const value = Object.assign(Object.create(prototype), { nested: { n: 0 } });
    const state = create(
      { value, n: 0 },
      (draft) => {
        draft.n += 1;
      },
      { enableAutoFreeze: true }
    );
    expect(Object.isFrozen(state.value)).toBe(true);
    expect(Object.isFrozen(state.value.nested)).toBe(true);
    expect(warn).not.toHaveBeenCalled();
  } finally {
    warn.mockRestore();
  }
});

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
      const base = { node: new Node(), item: { k: 1 }, n: 0 };
      const update = () =>
        create(
          base,
          (draft) => {
            draft.n += 1;
          },
          { enableAutoFreeze: true }
        );
      if (dev) {
        expect(update).toThrow('Forbids circular reference');
      } else {
        const state = update();
        expect(state.node.self).toBe(state.node);
        expect(Object.isFrozen(state.node)).toBe(true);
      }
    });

    test('a mutable mark does not exempt a value from the 2.x freeze policy', () => {
      const { create } = mutative;
      const options = { enableAutoFreeze: true as const, mark: marks.mutable };
      const counter = markedMutable({ count: 0 });
      const state = create(
        { counter, n: 0 },
        (draft) => {
          draft.counter.count += 1;
        },
        options
      );
      expect(state.counter).toBe(counter);
      expect(counter.count).toBe(1);
      expect(Object.isFrozen(counter)).toBe(true);
      expect(Object.isFrozen(state)).toBe(true);
      expect(() =>
        create(
          state,
          (draft) => {
            draft.counter.count += 1;
          },
          options
        )
      ).toThrow(TypeError);
    });

    test('a regular expression retains the 2.x freeze policy', () => {
      const { create } = mutative;
      const state = create(
        { pattern: /a/g, n: 0 },
        (draft) => {
          draft.n += 1;
        },
        { enableAutoFreeze: true }
      );
      expect(Object.isFrozen(state.pattern)).toBe(true);
      expect(() => state.pattern.test('a')).toThrow(TypeError);
    });

    test('auto-freeze does not call marks for unread objects', () => {
      const { create } = mutative;
      const seen = new Set<unknown>();
      const base = { unread: { a: 1 }, n: 0 };
      create(
        base,
        (draft) => {
          draft.n += 1;
        },
        {
          enableAutoFreeze: true,
          mark: (value: unknown) => {
            seen.add(value);
            return undefined;
          },
        }
      );
      expect(seen.has(base.unread)).toBe(false);
      expect(Object.isFrozen(base.unread)).toBe(true);
    });

    test('a shared class instance cannot be used to change earlier states', () => {
      const { create } = mutative;
      const base = { point: new Point(), n: 0 };
      const state = create(
        base,
        (draft) => {
          draft.n += 1;
        },
        { enableAutoFreeze: true }
      );
      expect(state.point).toBe(base.point);
      expect(() => {
        (state.point as Point).nested.y = 42;
      }).toThrow(TypeError);
      expect(base.point.nested.y).toBe(0);
    });

    test('a no-op recipe freezes a class instance and its children', () => {
      const { create } = mutative;
      const base = { point: new Point() };
      const state = create(base, () => {}, { enableAutoFreeze: true });
      expect(state).toBe(base);
      expect(Object.isFrozen(state.point)).toBe(true);
      expect(Object.isFrozen(state.point.nested)).toBe(true);
    });

    test('an identity mark does not leave the changed class copy unfrozen', () => {
      const { create } = mutative;
      const point = new Point();
      const state = create(
        { point },
        (draft) => {
          draft.point.x = 1;
        },
        {
          enableAutoFreeze: true,
          mark: (value, { immutable }) =>
            value === point ? immutable : undefined,
        }
      );
      expect(state.point).not.toBe(point);
      expect(state.point.x).toBe(1);
      expect(point.x).toBe(0);
      expect(Object.isFrozen(state.point)).toBe(true);
      expect(Object.isFrozen(state.point.nested)).toBe(true);
    });
  });
}
