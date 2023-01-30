/* eslint-disable consistent-return */
/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { create } from '../src';

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
