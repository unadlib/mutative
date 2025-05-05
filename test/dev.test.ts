/* eslint-disable consistent-return */
/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { apply, create } from '../src';

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
  }).not.toThrowError();

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
  }).not.toThrowError();
});

test('custom shallow copy with checking in dev mode', () => {
  global.__DEV__ = true;
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
  }).toThrowErrorMatchingInlineSnapshot(
    `"You can't use mark and patches or auto freeze together."`
  );

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
  }).toThrowErrorMatchingInlineSnapshot(
    `"You can't use mark and patches or auto freeze together."`
  );
});

test('check warn when apply patches with other options', () => {
  {
    global.__DEV__ = true;
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
      }
    );
    expect(console.warn).toHaveBeenCalledWith(
      'The "mutable" option is not allowed to be used with other options.'
    );
  }
  {
    global.__DEV__ = true;
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
    expect(console.warn).toHaveBeenCalledWith(
      'The "mutable" option is not allowed to be used with other options.'
    );
  }
});
