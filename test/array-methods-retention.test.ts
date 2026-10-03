/* eslint-disable @typescript-eslint/no-explicit-any */
import { setFlagsFromString } from 'node:v8';
import { runInNewContext } from 'node:vm';
import { apply, create } from '../src';

// A full collection without starting the test runner with --expose-gc.
setFlagsFromString('--expose-gc');
const gc: () => void = runInNewContext('gc');

async function collect() {
  for (let index = 0; index < 10; index += 1) {
    await new Promise((resolve) => {
      setImmediate(resolve);
    });
    gc();
  }
}

// Ends a producer over a fresh state and returns a weak reference to its
// list, so that only the library could keep the list alive afterwards.
async function track(end: (base: { list: { id: number }[] }) => unknown) {
  const base = { list: Array.from({ length: 100 }, (_, id) => ({ id })) };
  const reference = new WeakRef(base.list);
  try {
    await end(base);
  } catch {
    // Several producers below fail on purpose.
  }
  return reference;
}

describe('array method receivers do not keep producers alive', () => {
  test('the check detects a state that is still referenced', async () => {
    let kept: unknown;
    const reference = await track((base) => {
      kept = base;
    });
    await collect();
    expect(reference.deref()).toBeDefined();
    expect(kept).toBeDefined();
  });

  test.each([
    [
      'a successful producer',
      (base: any) =>
        create(base, (draft: any) => {
          draft.list.shift();
        }),
    ],
    [
      'a recipe that throws',
      (base: any) =>
        create(base, (draft: any) => {
          draft.list.shift();
          throw new Error('recipe');
        }),
    ],
    [
      'a recipe that changes the draft and returns another value',
      (base: any) =>
        create(base, (draft: any) => draft.list.unshift({ id: -1 })),
    ],
    [
      'a recipe that returns a modified child draft',
      (base: any) =>
        create(base, (draft: any) => {
          draft.list.shift();
          draft.list[0].id = 9;
          return draft.list[0];
        }),
    ],
    [
      'an async recipe that changes the draft and returns another value',
      (base: any) =>
        create(base, async (draft: any) => draft.list.unshift({ id: -1 })),
    ],
    [
      'an abandoned draft of create without a recipe',
      (base: any) => {
        const [draft] = create(base);
        (draft as any).list.shift();
      },
    ],
  ])('%s', async (_name, end) => {
    const reference = await track(end);
    await collect();
    expect(reference.deref()).toBeUndefined();
  });

  test('drafts of create without a recipe keep their array methods', () => {
    const base = { a: [{ id: 1 }, { id: 2 }], b: [{ id: 3 }] };
    const [draft, finalize] = create(base, { enablePatches: true });
    draft.b.unshift(draft.a.shift()!);
    draft.a.reverse();
    expect(draft.b.indexOf(draft.b[0])).toBe(0);
    const [state, patches, inverse] = finalize();
    expect(state).toStrictEqual({ a: [{ id: 2 }], b: [{ id: 1 }, { id: 3 }] });
    expect(apply(base, patches)).toStrictEqual(state);
    expect(apply(state, inverse)).toStrictEqual(base);
  });
});
