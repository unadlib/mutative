import { apply, create, isDraft } from '../src';

global.__DEV__ = false;

test('check not warn when apply patches with other options in prod mode', () => {
  {
    const baseState = { foo: { bar: 'test' } };
    const warn = console.warn;
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    apply(
      baseState,
      [
        {
          op: 'replace',
          path: ['foo', 'bar'],
          value: 'test2',
        },
      ],
      {
        mutable: true,
        enableAutoFreeze: true,
        mark: () => {},
      }
    );
    expect(console.warn).not.toHaveBeenCalledWith(
      'The "mutable" option is not allowed to be used with other options.'
    );
  }
});

test('custom shallow copy without checking in prod mode', () => {
  global.__DEV__ = false;
  const baseState = { foo: { bar: 'test' } };

  expect(() => {
    create(
      baseState,
      (draft) => {
        draft.foo.bar = 'test2';
      },
      {
        enableAutoFreeze: true,
        // @ts-expect-error
        mark: (target) => {
          if (target === baseState.foo) {
            return () => ({ ...target });
          }
        },
      }
    );
  }).not.toThrow();

  expect(() => {
    create(
      baseState,
      (draft) => {
        draft.foo.bar = 'test2';
      },
      {
        enablePatches: true,
        // @ts-expect-error
        mark: (target) => {
          if (target === baseState.foo) {
            return () => ({ ...target });
          }
        },
      }
    );
  }).not.toThrow();
});

test('wraps unowned draft with its own draft', () => {
  create(
    { a: {} },
    (parent) => {
      create(
        { a: parent.a },
        (child) => {
          expect(child.a).not.toBe(parent.a);
          expect(isDraft(child.a)).toBeTruthy();
        },
        {
          enableAutoFreeze: true,
        }
      );
    },
    {
      enableAutoFreeze: true,
    }
  );
});
