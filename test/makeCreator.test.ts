import { makeCreator } from '../src';

test('check makeCreator options', () => {
  [
    [],
    null,
    0,
    1,
    '',
    'str',
    true,
    false,
    new Map(),
    new Set(),
    Symbol(''),
    function () {
      //
    },
  ].forEach((arg) => {
    expect(() => {
      // @ts-expect-error
      makeCreator(arg);
    }).toThrowError(`'options' should be an object.`);
  });
});

test('check enableAutoFreeze', () => {
  const create = makeCreator({
    enableAutoFreeze: true,
  });
  const baseState = { foo: { bar: 'str' }, arr: [] };
  const state = create(baseState, (draft) => {
    //
  });
  expect(Object.isFrozen(state)).toBeTruthy();
});

test('check enableAutoFreeze - override', () => {
  const create = makeCreator({
    enableAutoFreeze: true,
  });
  const baseState = { foo: { bar: 'str' }, arr: [] };
  const state = create(
    baseState,
    (draft) => {
      //
    },
    {
      enableAutoFreeze: false,
    }
  );
  expect(Object.isFrozen(state)).not.toBeTruthy();
});

test('check enablePatches', () => {
  const create = makeCreator({
    enablePatches: true,
  });
  const baseState = { foo: { bar: 'str' }, arr: [] };
  const state = create(baseState, (draft) => {
    //
  });
  expect(Array.isArray(state)).toBeTruthy();
});

test('check enablePatches - override', () => {
  const create = makeCreator({
    enablePatches: true,
  });
  const baseState = { foo: { bar: 'str' }, arr: [] };
  const state = create(
    baseState,
    (draft) => {
      //
    },
    {
      enablePatches: false,
    }
  );
  expect(Array.isArray(state)).not.toBeTruthy();
});

test('check strict', () => {
  const create = makeCreator({
    strict: true,
  });
  class C {
    x = 0;
  }
  const baseState = { foo: { bar: 'str' }, arr: [], c: new C() };
  expect(() => {
    const state = create(baseState, (draft) => {
      draft.c.x = 1;
    });
  }).toThrowError();
});

test('check strict - override', () => {
  const create = makeCreator({
    strict: true,
  });
  class C {
    x = 0;
  }
  const baseState = { foo: { bar: 'str' }, arr: [], c: new C() };
  expect(() => {
    const state = create(
      baseState,
      (draft) => {
        draft.c.x = 1;
      },
      { strict: false }
    );
  }).not.toThrowError();
});

test('check mark', () => {
  class C {
    x = 0;
  }
  const create = makeCreator({
    mark: (target, { immutable }) => {
      if (target instanceof C) {
        return immutable;
      }
    },
  });
  const baseState = { foo: { bar: 'str' }, arr: [], c: new C() };
  const state = create(baseState, (draft) => {
    draft.c.x = 1;
  });
  expect(state.c.x).toBe(1);
  expect(state.c).not.toBe(baseState.c);
});

test('check mark - override', () => {
  class C {
    x = 0;
  }
  const create = makeCreator({
    mark: (target, { immutable }) => {
      if (target instanceof C) {
        return immutable;
      }
    },
  });
  const baseState = { foo: { bar: 'str' }, arr: [], c: new C() };
  const state = create(
    baseState,
    (draft) => {
      draft.c.x = 1;
    },
    {
      mark: undefined,
    }
  );
  expect(state.c.x).toBe(1);
  expect(state.c).toBe(baseState.c);
});
