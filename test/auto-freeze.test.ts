/* eslint-disable @typescript-eslint/no-explicit-any */
// Which values auto-freeze freezes, in development and production builds.
import { vi } from 'vitest';

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
  ['a class instance', () => new Point(), both(false)],
  [
    'a plain object that a class instance holds',
    () => new Point(),
    both(false),
    { at: (point) => point.nested },
  ],
  ['a null-prototype object', () => Object.create(null), both(false)],
  ['a date', () => new Date(0), both(false)],
  ['a regular expression', () => /a/g, both(false)],
  ['a function', () => () => 1, both(false)],
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
    both(false),
    { mark: marks.mutable },
  ],
  [
    'a class instance marked mutable',
    () => markedMutable(new Point()),
    both(false),
    { mark: marks.mutable },
  ],
];

test('development builds warn once when auto-freeze leaves a class instance unfrozen', async () => {
  vi.resetModules();
  globalThis.__DEV__ = true;
  const { create } = await import('../src');
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    const update = (value: any, mark?: any) =>
      create(
        { value, n: 0 },
        (draft) => {
          draft.n += 1;
        },
        { enableAutoFreeze: true, mark }
      );
    // Objects without own enumerable properties, and values marked mutable,
    // give no warning.
    update(new Date(0));
    update(new Uint8Array(1));
    update(markedMutable(new Point()), marks.mutable);
    expect(warn).not.toHaveBeenCalled();
    update(new Point());
    update(Object.assign(Object.create(null), { a: 1 }));
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toMatch(
      /^Auto-freeze left an instance of Point unfrozen: since Mutative 2\.1/
    );
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
      ['a class instance', () => new Point(), false],
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
      const state = create(
        base,
        (draft) => {
          draft.n += 1;
        },
        { enableAutoFreeze: true }
      );
      expect(Object.isFrozen(state.node)).toBe(false);
    });

    test('a value marked mutable can be changed in place by later updates', () => {
      const { create } = mutative;
      const options = { enableAutoFreeze: true as const, mark: marks.mutable };
      const counter = markedMutable({ count: 0 });
      let state = create(
        { counter, n: 0 },
        (draft) => {
          draft.counter.count += 1;
        },
        options
      );
      state = create(
        state,
        (draft) => {
          draft.counter.count += 1;
        },
        options
      );
      expect(state.counter).toBe(counter);
      expect(counter.count).toBe(2);
      expect(Object.isFrozen(state)).toBe(true);
      // A state that is marked mutable as a whole, too.
      const root = markedMutable({ count: 0 });
      for (let i = 0; i < 2; i += 1) {
        create(
          root,
          (draft) => {
            draft.count += 1;
          },
          options
        );
      }
      expect(root.count).toBe(2);
      expect(Object.isFrozen(root)).toBe(false);
    });

    test('a regular expression with the global flag keeps working', () => {
      const { create } = mutative;
      const state = create(
        { pattern: /a/g, n: 0 },
        (draft) => {
          draft.n += 1;
        },
        { enableAutoFreeze: true }
      );
      expect(state.pattern.test('a')).toBe(true);
      expect(state.pattern.lastIndex).toBe(1);
    });

    test('auto-freeze calls the marks for the objects that it reaches', () => {
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
      expect(seen.has(base.unread)).toBe(true);
      expect(Object.isFrozen(base.unread)).toBe(true);
    });
  });
}
