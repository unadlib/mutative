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
  // const prevState = apply(state, inversePatches);
  // expect(prevState).toEqual(data);
  const nextState = apply(data as any, patches);
  expect(nextState).toEqual(state);
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
  // expect(patches).toEqual([
  //   [['object', 'set'], ['foobar', 'foo'], [['__MUTATIVE__', 'foo']]],
  //   [['object', 'set'], ['foo', 'bar'], ['new str']],
  // ]);
  // expect(inversePatches).toEqual([
  //   [['object', 'set'], ['foo', 'bar'], ['str']],
  //   [['object', 'delete'], ['foobar', 'foo'], []],
  // ]);
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
  // expect(patches1).toEqual([[['object', 'set'], ['items'], [[]]]]);
  // expect(patches2).toEqual([[['array', 'push'], ['items'], [2]]]);
  const lastState1 = apply(state, [...patches1, ...patches2]);
  // expect(patches1).toEqual([[['object', 'set'], ['items'], [[]]]]);
  // expect(patches2).toEqual([[['array', 'push'], ['items'], [2]]]);
  expect(lastState1).toEqual(lastState);
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

test('enablePatches and assign with ref array', () => {
  checkPatches(
    { a: { b: { c: 1 } }, arr0: [{ a: 1 }], arr1: [{ a: 1 }] },
    (draft: any) => {
      draft.arr0.push(draft.a.b);
      draft.arr0.push(draft.arr1);
      draft.a.b.c = 2;
      draft.a.b.c = 333;
      delete draft.a.b;
      draft.arr1[0].a = 222;
      draft.arr0[1].a = 333;
      draft.arr0[2].a = 444;
    }
  );
});

test('simple array', () => {
  checkPatches(
    { a: { b: { c: 1 } }, arr0: [{ a: 1 }], arr1: [{ a: 1 }] },
    (draft: any) => {
      const a = draft.arr1[0];
      draft.arr0.push(a);
      draft.arr0.slice(-1)[0].a = 2;
      draft.arr0.pop();
    }
  );
});

test('array case1', () => {
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

test('array case2', () => {
  checkPatches(
    {
      arr0: [{ bar: 'str0' }, { bar: 'str0' }],
      arr1: [{ bar: 'str1' }, { bar: 'str1' }],
      arr2: [{ bar: 'str1' }, { bar: 'str1' }],
      arr3: [{ bar: 'str1' }, { bar: 'str1' }],
      arr4: [{ bar: 'str1' }, { bar: 'str1' }],
      arr5: [{ bar: 'str1' }, { bar: 'str1' }],
      foobar: {
        baz: 'str',
      } as any,
    },
    (draft) => {
      draft.arr0.push({ bar: 'str' });
      draft.arr0.unshift({ bar: 'str' });
      draft.arr2.push(draft.arr1[0]);
      draft.arr2[2].bar = 'new str111';
      draft.arr1.shift();
      draft.arr3.length = 1;
      draft.arr4.length = 0;
      draft.arr2.splice(1, 4);
    }
  );
});

test('simple map', () => {
  checkPatches(
    {
      map: new Map<any, any>([
        ['a', { bar: 'str' }],
        ['c', { bar: 'str' }],
      ]),
      foobar: {
        baz: 'str',
      } as any,
    },
    (draft) => {
      draft.map.set('b', { bar: 'str' });
      draft.map.values().next().value.bar = 'new str';
      draft.map.get('a').bar = 'new str';
    }
  );
});

test('map', () => {
  checkPatches(
    {
      map: new Map<any, any>([
        ['a', { bar: 'str' }],
        ['c', { bar: 'str' }],
      ]),
      map1: new Map<any, any>([
        ['a', { bar: 'str' }],
        ['c', { bar: 'str' }],
      ]),
      map2: new Map<any, any>([
        ['a', { bar: 'str' }],
        ['c', { bar: 'str' }],
      ]),
      map3: new Map<any, any>([
        ['a', { bar: 'str' }],
        ['c', { bar: 'str' }],
      ]),
      map4: new Map<any, any>([
        ['a', { bar: 'str' }],
        ['c', { bar: 'str' }],
      ]),
      foobar: {
        baz: 'str',
      } as any,
    },
    (draft) => {
      draft.map.set('b', { bar: 'str' });
      draft.map.values().next().value.bar = 'new str';
      draft.map1.clear();
      draft.map3.set('a', draft.map2.get('c'));
      draft.map2.get('c').bar = 'new str';
      draft.map2.delete('c');
      draft.map4.get('a').bar = 'new str';
      draft.map4.delete('a');
    }
  );
});

test('simple set', () => {
  checkPatches(
    {
      set: new Set<any>([{ bar: 'str' }, { bar: 'str' }]),
      foobar: {
        baz: 'str',
      } as any,
    },
    (draft) => {
      draft.set.add({ bar: 'str1' });
      draft.set.values().next().value.bar = 'new str0';
      Array.from(draft.set.keys())[1].bar = 'new str1';
    }
  );
});

test('set', () => {
  checkPatches(
    {
      set: new Set([{ bar: 'str1111' }, { bar: 'str222' }]),
      set1: new Set([{ bar: 'str' }, { bar: 'str' }]),
      set2: new Set([{ bar: 'str' }, { bar: 'str' }]),
      set3: new Set([{ bar: 'str' }, { bar: 'str' }]),
      foobar: {
        baz: 'str',
      } as any,
    },
    (draft) => {
      draft.set.add({ bar: 'str' });
      draft.set.values().next().value.bar = 'new str0';
      draft.set1.clear();
      const a = draft.set.values().next().value;
      draft.set3.add(a);
      a.bar = 'new str1';
      draft.set.delete(a);
    }
  );
});

test('object with delete', () => {
  checkPatches(
    {
      foobar: {
        baz: 'str',
      } as any,
    },
    (draft) => {
      draft.foobar.baz = 'new str';
      const a = draft.foobar;
      delete draft.foobar;

      a.baz = 'new str1';
      // @ts-ignore
      draft.foobar1 = a;
      // @ts-ignore
      draft.foobar1.baz = 'new str2';
    }
  );
});
