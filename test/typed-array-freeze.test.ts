/* eslint-disable @typescript-eslint/no-explicit-any */
// https://github.com/unadlib/mutative/issues/219
import { vi } from 'vitest';

const views = () => [
  new Uint8Array([1, 2, 3]),
  new Float64Array([1.5]),
  new BigInt64Array([BigInt(1)]),
  new Uint8Array(0),
  Buffer.from([1, 2, 3]),
  new DataView(new ArrayBuffer(4)),
  new Uint8Array(new ArrayBuffer(2, { maxByteLength: 8 })),
];

for (const dev of [true, false]) {
  describe(`ArrayBuffer views under auto-freeze, ${dev ? 'development' : 'production'}`, () => {
    let mutative: typeof import('../src');
    beforeAll(async () => {
      vi.resetModules();
      globalThis.__DEV__ = dev;
      mutative = await import('../src');
    });
    afterAll(() => {
      globalThis.__DEV__ = true;
    });

    test('a view next to a changed value is shared and left unfrozen', () => {
      const { create } = mutative;
      for (const view of views()) {
        const base = { view, list: [{ n: 0 }], other: { n: 0 } };
        const state = create(
          base,
          (draft) => {
            draft.list[0].n = 1;
          },
          { enableAutoFreeze: true }
        );
        expect(state.view).toBe(view);
        expect(Object.isFrozen(state.view)).toBe(false);
        expect(Object.isFrozen(state)).toBe(true);
        expect(Object.isFrozen(state.list[0])).toBe(true);
        expect(Object.isFrozen(state.other)).toBe(true);
        // A later update still works and freezes its copies.
        const next = create(
          state,
          (draft) => {
            draft.other.n = 2;
          },
          { enableAutoFreeze: true }
        );
        expect(next.view).toBe(view);
        expect(Object.isFrozen(next.other)).toBe(true);
      }
    });

    test('views in arrays, Map values, Map keys and Set items, assigned or unchanged', () => {
      const { create } = mutative;
      for (const view of views()) {
        const make = () => ({
          list: [view],
          map: new Map<any, any>([
            ['k', view],
            [view, 'v'],
          ]),
          set: new Set<any>([view]),
          n: 0,
        });
        // Unchanged parts of the base state, a no-op recipe included.
        const base = make();
        expect(create(base, () => {}, { enableAutoFreeze: true })).toBe(base);
        expect(Object.isFrozen(base.map)).toBe(true);
        expect(Object.isFrozen(view)).toBe(false);
        // Values that the recipe assigns.
        const state = create(
          { n: 0 } as any,
          (draft) => {
            Object.assign(draft, make());
            draft.direct = view;
          },
          { enableAutoFreeze: true }
        );
        expect(state.direct).toBe(view);
        expect(state.map.get('k')).toBe(view);
        expect(state.set.has(view)).toBe(true);
        expect(Object.isFrozen(state.set)).toBe(true);
        expect(Object.isFrozen(view)).toBe(false);
      }
    });

    test('returned values that hold views, or are views', () => {
      const { create } = mutative;
      const view = new Uint8Array([1]);
      const base = { view, item: { n: 0 } };
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      try {
        const state: any = create(
          base as any,
          (draft: any) => ({
            view: draft.view,
            item: draft.item,
            extra: [draft.item],
          }),
          { enableAutoFreeze: true }
        );
        // Drafts next to the view are still replaced.
        expect(state.item).toBe(base.item);
        expect(state.extra[0]).toBe(base.item);
        expect(state.view).toBe(view);
        expect(Object.isFrozen(state)).toBe(true);
        const returned = create(base, () => view as any, {
          enableAutoFreeze: true,
        });
        expect(returned).toBe(view);
      } finally {
        warn.mockRestore();
      }
    });

    test('a returned value is searched without listing the elements of views', () => {
      const { create } = mutative;
      const view = new Uint8Array(1000);
      const base = { view, n: 0 };
      const ownKeys = vi.spyOn(Reflect, 'ownKeys');
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      try {
        create(base, (draft) => ({ view: draft.view, n: draft.n + 1 }));
        expect(ownKeys.mock.calls.some(([target]) => target === view)).toBe(
          false
        );
      } finally {
        ownKeys.mockRestore();
        warn.mockRestore();
      }
    });

    test('apply() with auto-freeze and a patch whose value is a view', () => {
      const { create, apply } = mutative;
      const view = new Uint8Array([7]);
      const [, patches] = create(
        { n: 0 } as any,
        (draft) => {
          draft.view = view;
        },
        { enablePatches: true }
      );
      const state = apply({ n: 0 } as any, patches, { enableAutoFreeze: true });
      expect(state.view).toBe(view);
      expect(Object.isFrozen(state)).toBe(true);
      expect(Object.isFrozen(view)).toBe(false);
    });

    test('a view that the application froze stays frozen and is skipped', () => {
      const { create } = mutative;
      const view = Object.freeze(new Uint8Array(0));
      const state = create(
        { view, n: 0 },
        (draft) => {
          draft.n = 1;
        },
        { enableAutoFreeze: true }
      );
      expect(state.view).toBe(view);
      expect(Object.isFrozen(state.view)).toBe(true);
    });

    test('a view that a mark makes draftable is left unfrozen too', () => {
      const { create } = mutative;
      const marks = [
        (value: any, types: any) =>
          ArrayBuffer.isView(value) ? types.immutable : undefined,
        (value: any) =>
          value instanceof Uint8Array ? () => value.slice() : undefined,
      ];
      for (const mark of marks) {
        const view = new Uint8Array([1, 2]);
        const state = create(
          { view, n: 0 },
          (draft) => {
            draft.n = 1;
          },
          { enableAutoFreeze: true, mark }
        );
        expect(state.view).toBe(view);
        expect(Object.isFrozen(view)).toBe(false);
      }
    });
  });
}
