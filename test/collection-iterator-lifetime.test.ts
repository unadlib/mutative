/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from '../src';

const hasIteratorHelpers =
  typeof (globalThis as any).Iterator?.prototype?.toArray === 'function';

test('Map keys stay undrafted and keep their native iterator lifetime', () => {
  const key = { value: 1 };
  let iterator!: IterableIterator<typeof key>;
  create(new Map([[key, { value: 2 }]]), (draft) => {
    iterator = draft.keys();
  });
  expect(iterator.next().value).toBe(key);
  expect(iterator.next().done).toBe(true);
});

describe.each(['Map', 'Set'] as const)('%s iterator lifetime', (kind) => {
  const makeCollection = () => {
    const values = [{ value: 1 }, { value: 2 }];
    return kind === 'Map'
      ? new Map(values.map((value, index) => [index, value]))
      : new Set(values);
  };
  const methods =
    kind === 'Map'
      ? ['values', 'entries', Symbol.iterator]
      : ['values', 'entries', 'keys', Symbol.iterator];

  describe.each(methods)('%s', (method) => {
    test.each([false, true])(
      'cannot yield values after a successful producer (changed: %s)',
      (changed) => {
        const base = makeCollection();
        let iterator: any;
        const state = create(base, (draft: any) => {
          iterator = draft[method]();
          if (changed) {
            if (kind === 'Map') draft.set(2, { value: 3 });
            else draft.add({ value: 3 });
          }
        });
        expect(() => iterator.next()).toThrow(TypeError);
        expect([...base.values()]).toStrictEqual([{ value: 1 }, { value: 2 }]);
        expect([...state.values()]).toStrictEqual(
          changed
            ? [{ value: 1 }, { value: 2 }, { value: 3 }]
            : [...base.values()]
        );
        if (!changed) expect(state).toBe(base);
      }
    );

    test('cannot yield values after a failed producer', () => {
      let iterator: any;
      const error = new Error('recipe failed');
      expect(() =>
        create(makeCollection(), (draft: any) => {
          iterator = draft[method]();
          throw error;
        })
      ).toThrow(error);
      expect(() => iterator.next()).toThrow(TypeError);
    });

    test('cannot yield values after manual finalization', () => {
      const [draft, finalize] = create(makeCollection());
      const iterator = (draft as any)[method]();
      finalize();
      expect(() => iterator.next()).toThrow(TypeError);
    });

    test.each([false, true])(
      'stays active until an async recipe settles (rejected: %s)',
      async (rejected) => {
        let release!: () => void;
        const gate = new Promise<void>((resolve) => {
          release = resolve;
        });
        const base = makeCollection();
        let iterator: any;
        const error = new Error('async recipe failed');
        const pending = create(base, async (draft: any) => {
          iterator = draft[method]();
          await gate;
          if (rejected) throw error;
        });
        const first = iterator.next().value;
        const value = Array.isArray(first) ? first[1] : first;
        value.value = 10;
        release();
        if (rejected) {
          await expect(pending).rejects.toThrow(error);
        } else {
          expect([...(await pending).values()]).toStrictEqual([
            { value: 10 },
            { value: 2 },
          ]);
        }
        expect(() => iterator.next()).toThrow(TypeError);
        expect(() => value.value).toThrow(TypeError);
        expect([...base.values()]).toStrictEqual([{ value: 1 }, { value: 2 }]);
      }
    );

    test.runIf(hasIteratorHelpers)(
      'lazy iterator helpers cannot outlive the producer',
      () => {
        let iterator: any;
        create(makeCollection(), (draft: any) => {
          iterator = draft[method]().map((value: any) => value);
        });
        expect(() => iterator.toArray()).toThrow(TypeError);
      }
    );

    test('an exhausted iterator stays exhausted', () => {
      let iterator: any;
      create(makeCollection(), (draft: any) => {
        iterator = draft[method]();
        expect([...iterator]).toHaveLength(2);
      });
      expect(iterator.next()).toStrictEqual({ done: true, value: undefined });
    });
  });

  test('forEach stops yielding values if a callback finalizes the draft', () => {
    const [draft, finalize] = create(makeCollection());
    let calls = 0;
    expect(() =>
      draft.forEach(() => {
        calls += 1;
        finalize();
      })
    ).toThrow(TypeError);
    expect(calls).toBe(1);
  });
});
