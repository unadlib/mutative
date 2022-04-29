import { create, apply } from '../src';
import { deepClone } from '../src/utils';


function checkPatches<T>(data: T, fn: (checkPatches: T) => void) {
  const [state, patches, inversePatches] = create(data as any, fn, {
    enablePatches: true,
  }) as any;
  const mutatedResult = deepClone(data);
  fn(mutatedResult);
  expect(state).toEqual(mutatedResult);
  expect(patches).toMatchSnapshot();
  expect(inversePatches).toMatchSnapshot();
  const prevState = apply(state, inversePatches);
  expect(prevState).toEqual(data);
  // const nextState = apply(data as any, patches);
  // expect(nextState).toEqual(state);
}

test('object', () => {
  const data = {
    foo: {
      bar: 'str',
    },
    foobar: {
      baz: 'str',
    },
  };

  const [state, patches, inversePatches] = create(
    data,
    (draft) => {
      draft.foo.bar = 'new str';
    },
    {
      enablePatches: true,
    }
  );
  expect(state).toEqual({
    foo: { bar: 'new str' },
    foobar: { baz: 'str' },
  });
  expect(state).not.toBe(data);
  expect(state.foo).not.toBe(data.foo);
  expect(state.foobar).toBe(data.foobar);
  const prevState = apply(state, inversePatches);
  expect(prevState).toEqual(data);
  const nextState = apply(prevState, patches);
  expect(nextState).toEqual(state);
});

test('object assign ref', () => {
  const data = {
    foo: {
      bar: 'str',
    },
    foobar: {
      baz: 'str',
    },
  };

  const [state, patches, inversePatches] = create(
    data,
    (draft: any) => {
      draft.foobar.foo = draft.foo;
      draft.foo.bar = 'new str';
    },
    {
      enablePatches: true,
    }
  );
  expect(state).toEqual({
    foo: { bar: 'new str' },
    foobar: {
      baz: 'str',
      foo: { bar: 'new str' },
    },
  });
  expect(state).not.toBe(data);
  expect(state.foo).not.toBe(data.foo);
  expect(state.foobar).not.toBe(data.foobar);
  expect(patches).toEqual([
    [['object', 'set'], ['foobar', 'foo'], [['__MUTATIVE__', 'foo']]],
    [['object', 'set'], ['foo', 'bar'], ['new str']],
  ]);
  expect(inversePatches).toEqual([
    [['object', 'set'], ['foo', 'bar'], ['str']],
    [['object', 'delete'], ['foobar', 'foo'], []],
  ]);
  const prevState = apply(state, inversePatches);
  expect(prevState).toEqual(data);
  const nextState = apply(prevState, patches);
  expect(nextState).toEqual(state);
});

test('patches mutate', () => {
  const state = {
    items: [] as number[],
  };

  const [nextState, patches1] = create(
    state,
    (draft) => {
      draft.items = [];
    },
    {
      enablePatches: true,
    }
  );

  const [lastState, patches2] = create(
    nextState,
    (draft) => {
      draft.items.push(2);
    },
    {
      enablePatches: true,
    }
  );
  expect(patches1).toEqual([[['object', 'set'], ['items'], [[]]]]);
  expect(patches2).toEqual([[['array', 'push'], ['items'], [2]]]);
  const lastState1 = apply(state, [...patches1, ...patches2]);
  expect(patches1).toEqual([[['object', 'set'], ['items'], [[]]]]);
  expect(patches2).toEqual([[['array', 'push'], ['items'], [2]]]);
  expect(lastState1).toEqual(lastState);
});

test('array', () => {
  checkPatches(
    {
      arr: [1, 2, 3],
      arr1: [{ a: 1 }],
      arr2: ['a', 'b', 'c'],
      arr3: ['a', 'b', 'c'],
      arr4: [1, 2, 3],
      arr5: ['a', 'b', 'c'],
      arr6: ['a', 'b', 'c'],
      arr7: [2, 1, 3, 6],
      arr8: [1, 2, 3],
      arr9: [1, 2, 3],
      arr10: [1, 2],
      foobar: {
        baz: 'str',
      },
    },
    (draft) => {
      draft.arr.push(4);
      draft.arr.splice(2, 1, 7, 8, 9);
      draft.arr1[0].a = 0;
      draft.arr1.push({ a: 2 });
      draft.arr2.splice(3, 4, 'd');
      draft.arr3.pop();
      draft.arr4.unshift(0);
      draft.arr5.shift();
      draft.arr6.reverse();
      draft.arr7.sort();
      draft.arr8.length = 0;
      draft.arr9[10] = 10;
      delete draft.arr10[1];
    }
  );
});

test('enablePatches and assign/delete with ref object', () => {
  checkPatches({ a: { b: { c: 1 }, arr: [] } }, (draft: any) => {
    draft.x = draft.a.b;
    draft.x1 = draft.a.b;
    draft.a.arr.push(1);
    draft.a.b.c = 2;
    draft.a.b.c = 333;
    delete draft.a.b;
    draft.a.arr.push(2);
    draft.x1.c = 444;
    draft.a.b = { f: 1 };
  });
});

test('enablePatches and assign with ref object', () => {
  checkPatches({ a: { b: { c: 1 }, arr: [] } }, (draft: any) => {
    draft.x = draft.a.b;
    draft.x1 = draft.a.b;
    draft.a.arr.push(1);
    draft.a.b.c = 2;
    draft.a.b.c = 333;
    draft.a.arr.push(2);
  });
});


test.skip('map', () => {
  checkPatches(
    {
      map: new Map<any, any>([['a', { bar: 'str' }], ['c', { bar: 'str' }]]),
      map1: new Map<any, any>([['a', { bar: 'str' }], ['c', { bar: 'str' }]]),
      map2: new Map<any, any>([['a', { bar: 'str' }], ['c', { bar: 'str' }]]),
      map3: new Map<any, any>([['a', { bar: 'str' }], ['c', { bar: 'str' }]]),
      foobar: {
        baz: 'str',
      } as any,
    },
    (draft) => {
      // draft.map.set('b', { bar: 'str' });
      // draft.map.values().next().value.bar = 'new str';
      // draft.map1.clear();
      // draft.map2.delete('c');
      draft.map3.set('a', draft.foobar);
      draft.foobar.baz = 'new str';
      delete draft.foobar;
    }
  );
});
