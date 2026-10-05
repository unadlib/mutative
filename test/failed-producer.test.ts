/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from '../src';

// Drafts that escape a failed producer are revoked, wherever it failed.
function expectRevoked(...drafts: any[]) {
  for (const draft of drafts) {
    expect(() => draft.value).toThrow(TypeError);
    expect(() => {
      draft.value = 1;
    }).toThrow(TypeError);
  }
}

describe('drafts of a failed producer', () => {
  test('a recipe that throws', () => {
    let root: any;
    let child: any;
    expect(() =>
      create({ child: { value: 1 } }, (draft) => {
        root = draft;
        child = draft.child;
        throw new Error('recipe');
      })
    ).toThrow('recipe');
    expectRevoked(root, child);
  });

  test('a recipe that returns an already revoked draft', () => {
    let revoked: any;
    create({}, (draft) => {
      revoked = draft;
    });
    let root: any;
    let child: any;
    expect(() =>
      create({ child: { value: 1 } }, (draft) => {
        root = draft;
        child = draft.child;
        return revoked;
      })
    ).toThrow(TypeError);
    expectRevoked(root, child);
  });

  test.each([
    [
      'getPrototypeOf',
      (error: Error) =>
        new Proxy(
          {},
          {
            getPrototypeOf: () => {
              throw error;
            },
          }
        ),
    ],
    [
      'then getter',
      (error: Error) =>
        Object.defineProperty(Promise.resolve(), 'then', {
          get() {
            throw error;
          },
        }),
    ],
    [
      'then call',
      (error: Error) =>
        Object.defineProperty(Promise.resolve(), 'then', {
          value() {
            throw error;
          },
        }),
    ],
  ] as const)("an exception from a returned value's %s", (_name, returned) => {
    const error = new Error('returned value');
    let root: any;
    let child: any;
    let received: unknown;
    try {
      create({ child: { value: 1 } }, (draft) => {
        root = draft;
        child = draft.child;
        return returned(error) as any;
      });
    } catch (failure) {
      received = failure;
    }
    expect(received).toBe(error);
    expectRevoked(root, child);
  });

  test('a rejected async recipe keeps its error and revokes every draft', async () => {
    const error = new Error('async recipe');
    let root: any;
    let child: any;
    const pending = create({ child: { value: 1 } }, async (draft) => {
      root = draft;
      child = draft.child;
      await Promise.resolve();
      throw error;
    });
    await expect(pending).rejects.toBe(error);
    expectRevoked(root, child);
  });

  test('a recipe that changes the draft and returns another value', () => {
    let root: any;
    let child: any;
    expect(() =>
      create({ value: 1, child: { value: 1 } }, (draft) => {
        root = draft;
        child = draft.child;
        draft.value += 1;
        return { value: 3 } as any;
      })
    ).toThrow(
      'Either the value is returned as a new non-draft value, or only the draft is modified without returning any value.'
    );
    expectRevoked(root, child);
  });

  test('a recipe that returns a changed child draft', () => {
    let root: any;
    let child: any;
    expect(() =>
      create({ child: { value: 1 } }, (draft) => {
        root = draft;
        child = draft.child;
        draft.child.value = 2;
        return draft.child as any;
      })
    ).toThrow('Cannot return a modified child draft.');
    expectRevoked(root, child);
  });

  test('a recipe that returns a draft in a frozen object', () => {
    let child: any;
    expect(() =>
      create(
        { child: { value: 1 } },
        (draft) => {
          child = draft.child;
          return Object.freeze({ child: draft.child }) as any;
        },
        { enableAutoFreeze: true }
      )
    ).toThrow('The return value holds a draft in a frozen object');
    expectRevoked(child);
  });

  test('an async recipe that changes the draft and returns another value', async () => {
    let root: any;
    let child: any;
    await expect(
      create({ value: 1, child: { value: 1 } }, async (draft) => {
        root = draft;
        child = draft.child;
        draft.value += 1;
        return { value: 3 } as any;
      })
    ).rejects.toThrow('Either the value is returned');
    expectRevoked(root, child);
  });

  test('an error after finalization revoked the drafts is kept', () => {
    expect(() =>
      create(
        { child: { value: 1 } } as any,
        (draft) => {
          const value: any = {};
          value.self = value;
          draft.child.next = value;
        },
        { enableAutoFreeze: true }
      )
    ).toThrow('Forbids circular reference');
  });
});
