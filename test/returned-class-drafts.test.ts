import { vi } from 'vitest';

class Holder {
  constructor(public item: any) {}
}

const containers: [string, (item: any) => any, (value: any) => any][] = [
  [
    'a returned class instance',
    (item) => new Holder(item),
    (value) => value.item,
  ],
  [
    'a nested class instance',
    (item) => ({ holder: new Holder(item) }),
    (value) => value.holder.item,
  ],
  [
    'a Map and Set inside a class instance',
    (item) => new Holder(new Map([['items', new Set([item])]])),
    (value) => [...value.item.get('items')][0],
  ],
  [
    'a non-enumerable class property',
    (item) =>
      Object.defineProperty(new Holder(undefined), 'item', {
        value: item,
        writable: true,
        configurable: true,
        enumerable: false,
      }),
    (value) => value.item,
  ],
  [
    'an object without a prototype',
    (item) => Object.assign(Object.create(null), { item }),
    (value) => value.item,
  ],
];

for (const dev of [true, false]) {
  describe(`returned class drafts, ${dev ? 'development' : 'production'}`, () => {
    let mutative: typeof import('../src');
    beforeAll(async () => {
      vi.resetModules();
      globalThis.__DEV__ = dev;
      mutative = await import('../src');
    });
    afterAll(() => {
      globalThis.__DEV__ = true;
    });

    describe.each([false, true])('auto-freeze=%s', (enableAutoFreeze) => {
      describe.each([false, true])('strict rawReturn=%s', (useRawReturn) => {
        test.each(containers)(
          `%s resolves its draft, freeze=${enableAutoFreeze}, strict rawReturn=${useRawReturn}`,
          async (_, wrap, read) => {
            const { create, rawReturn } = mutative;
            const base = { item: { n: 1 } };
            let escaped: any;
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
            try {
              const [state, patches, inverse] = await create(
                base as any,
                (draft: any) => {
                  escaped = draft.item;
                  const value = wrap(draft.item);
                  return useRawReturn ? rawReturn(value) : value;
                },
                {
                  enableAutoFreeze,
                  enablePatches: true,
                  strict: useRawReturn,
                }
              );
              expect(read(state)).toBe(base.item);
              expect(read(state).n).toBe(1);
              expect(patches).toEqual([
                { op: 'replace', path: [], value: state },
              ]);
              expect(inverse).toEqual([
                { op: 'replace', path: [], value: base },
              ]);
              expect(() => escaped.n).toThrow(/revoked/);
            } finally {
              warn.mockRestore();
            }
          }
        );
      });
    });

    test('an async recipe resolves a draft held by its returned class', async () => {
      const { create } = mutative;
      const base = { item: { n: 1 } };
      const state = await create(
        base as any,
        async (draft: any) => {
          await Promise.resolve();
          return new Holder(draft.item);
        },
        { enableAutoFreeze: true }
      );
      expect(state.item).toBe(base.item);
      expect(state.item.n).toBe(1);
    });
  });
}
