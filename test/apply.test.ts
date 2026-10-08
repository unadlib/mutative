/* eslint-disable consistent-return */
/* eslint-disable no-self-assign */
/* eslint-disable no-lone-blocks */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prefer-const */
/* eslint-disable no-plusplus */
/* eslint-disable no-shadow */
/* eslint-disable prefer-destructuring */
/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { create, apply, Patches, original } from '../src';
import { deepClone } from '../src/utils';

test('classic case', () => {
  const data = {
    a: {
      c: 1,
    },
    b: 2,
  };
  const [state, patches, inversePatches] = create(
    data,
    (draft) => {
      const a = draft.a;
      // @ts-expect-error
      delete draft.a;
      a.c = 2;
      // @ts-expect-error
      draft.a1 = a;
    },
    {
      enablePatches: true,
    }
  );
  const prevState = apply(state, inversePatches);
  expect(prevState).toEqual(data);
  const nextState = apply(data, patches);
  expect(nextState).toEqual(state);
});

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
  const nextState = apply(data as any, patches);
  expect(nextState).toEqual(state);
}

test('array', () => {
  checkPatches([] as string[], (draft) => {
    draft.push('new str');
  });
});

test('object', () => {
  checkPatches(
    {
      foo: {
        bar: 'str',
      },
      foobar: {
        baz: 'str',
      },
    },
    (draft) => {
      draft.foo.bar = 'new str';
    }
  );
});

test('object - assign ref', () => {
  checkPatches(
    {
      foo: {
        bar: 'str',
      },
      foobar: {
        baz: 'str',
      },
      foobar1: {
        baz: 'str',
      },
    },
    (draft) => {
      // @ts-ignore
      draft.foo.bar1 = draft.foobar;
      // @ts-ignore
      draft.foobar = draft.foobar1;
    }
  );
});

test('object delete key', () => {
  checkPatches(
    {
      foo: {
        bar: 'str',
      },
      foobar: {
        baz: 'str',
      },
    } as any,
    (draft) => {
      delete draft.foo.bar;
    }
  );
});

test('object assign ref', () => {
  checkPatches(
    {
      foo: {
        bar: 'str',
      },
      foobar: {
        baz: 'str',
      },
    },
    (draft: any) => {
      draft.foobar.foo = draft.foo;
      draft.foo.bar = 'new str';
    }
  );
});

test('patches mutate', () => {
  checkPatches(
    {
      items: [] as number[],
    },
    (draft) => {
      draft.items = [];
    }
  );
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
      draft.arr0[2][0].a = 444;
    }
  );
});

test('simple array', () => {
  checkPatches(
    { a: { b: { c: 1 } }, arr0: [{ a: 1 }], arr1: [{ a: 1 }] },
    (draft: any) => {
      draft.arr0.push(draft.arr1);
      draft.arr0.slice(-1)[0][0].a = 2;
      draft.arr0.pop();
    }
  );
});

test('array', () => {
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
      draft.set.values().next().value!.bar = 'new str0';
      draft.set1.clear();
      const a = draft.set.values().next().value;
      draft.set3.add(a!);
      a!.bar = 'new str1';
      draft.set.delete(a!);
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

test('object with class', () => {
  class Bar {
    foo = 'str';
  }

  checkPatches(
    {
      foobar: {
        baz: 'str',
        bar: new Bar(),
      },
    },
    (draft) => {
      draft.foobar.baz = 'new str';
      draft.foobar.bar.foo = 'new str';
    },
    // @ts-ignore
    (target: any) => (target instanceof Bar ? 'immutable' : undefined)
  );
});

test('object with ref', () => {
  const f = {
    baz: 'str',
  };
  checkPatches(
    {
      foobar: f as any,
      f,
    },
    (draft) => {
      draft.foobar.baz = 'new str';
      const a = draft.foobar;
      delete draft.foobar;
      draft.f.baz = 'new str0';
      a.baz = 'new str1';
      // @ts-ignore
      draft.foobar1 = a;
      // @ts-ignore
      draft.foobar1.baz = 'new str2';
      draft.f.baz = 'new str3';
    }
  );
});

test('array with ref', () => {
  const f = {
    baz: 'str',
  };
  checkPatches(
    {
      foobar: [f] as any,
      f,
    },
    (draft) => {
      draft.foobar[0].baz = 'new str';
      const a = draft.foobar[0];
      draft.foobar.pop();
      draft.f.baz = 'new str0';
      a.baz = 'new str1';
      // @ts-ignore
      draft.foobar1 = a;
      // @ts-ignore
      draft.foobar1.baz = 'new str2';
      draft.f.baz = 'new str3';
    }
  );
});

test('array with ref', () => {
  checkPatches(
    {
      foobar: [] as any,
      f: {
        baz: 'str',
      },
    } as any,
    (draft) => {
      draft.f.baz = 'new str';
      const f = draft.f;
      draft.foobar.push({}, f);
      f.baz = 'new str0';
      delete draft.f;
    }
  );
});

test('array pop with ref', () => {
  const f = {
    baz: 'str',
  } as any;
  checkPatches(
    {
      foobar: [f] as any,
    },
    (draft: any) => {
      const f = draft.foobar[0];
      draft.foobar.pop();
      f.baz = 'new str0';
      draft.f = f;
    }
  );
});

test('array shift with ref', () => {
  const f = {
    baz: 'str',
  } as any;
  checkPatches(
    {
      foobar: [f] as any,
    },
    (draft: any) => {
      const f = draft.foobar[0];
      draft.foobar.shift();
      f.baz = 'new str0';
      draft.f = f;
    }
  );
});

test('array splice with ref', () => {
  const f = {
    baz: 'str',
  } as any;
  checkPatches(
    {
      foobar: [f] as any,
      bar: {
        baz: 'str',
      },
    },
    (draft: any) => {
      const f = draft.foobar[0];
      draft.foobar.splice(0, 1);
      f.baz = 'new str0';
      draft.f = f;
    }
  );
});

test('array length with ref', () => {
  const f = {
    baz: 'str',
  } as any;
  checkPatches(
    {
      foobar: [f] as any,
    },
    (draft: any) => {
      const f = draft.foobar[0];
      draft.foobar.length = 0;
      f.baz = 'new str0';
      draft.f = f;
    }
  );
});

test('array setter with ref', () => {
  const f = {
    baz: 'str',
  } as any;
  checkPatches(
    {
      foobar: [f] as any,
      bar: {
        baz: 'str',
      },
    },
    (draft: any) => {
      const f = draft.foobar[0];
      draft.foobar[0] = draft.bar;
      f.baz = 'new str0';
      draft.f = f;
    }
  );
});

test('object setter with ref', () => {
  const f = {
    baz: 'str',
  } as any;
  checkPatches(
    {
      foobar: { f } as any,
      bar: {
        baz: 'str',
      },
    },
    (draft: any) => {
      const { f } = draft.foobar;
      draft.foobar.f = draft.bar;
      f.baz = 'new str0';
      draft.f = f;
    }
  );
});

test('set with ref', () => {
  checkPatches(
    {
      foobar: new Set<any>([
        {
          baz: 'str0',
        },
      ]),
    },
    (draft: any) => {
      const f = draft.foobar.values().next().value;
      draft.foobar.delete(f);
      f.baz = 'new str0';
      draft.f = f;
    }
  );
});

test('map with ref', () => {
  checkPatches(
    {
      foobar: new Map<any, any>([
        [
          'a',
          {
            baz: 'str0',
          },
        ],
      ]),
    },
    (draft: any) => {
      const f = draft.foobar.values().next().value;
      draft.foobar.delete('a');
      f.baz = 'new str0';
      draft.f = f;
    }
  );
});

test('simple assignment - 1', () => {
  checkPatches({ x: 3 }, (d) => {
    d.x++;
  });
});

test('simple assignment - 2', () => {
  checkPatches({ x: { y: 4 } }, (d) => {
    d.x.y++;
  });
});

test('simple assignment - 3', () => {
  checkPatches({ x: [{ y: 4 }] }, (d) => {
    d.x[0].y++;
  });
});

test('simple assignment - 4', () => {
  checkPatches(new Map([['x', { y: 4 }]]), (d) => {
    // @ts-ignore
    d.get('x').y++;
  });
});

test('simple assignment - 5', () => {
  checkPatches({ x: new Map([['y', 4]]) }, (d) => {
    d.x.set('y', 5);
  });
});

test('simple assignment - 6', () => {
  checkPatches(new Map([['x', 1]]), (d) => {
    // Map.prototype.set should return the Map itself
    const res = d.set('x', 2);
    res.set('y', 3);
  });
});

test('simple assignment - 7', () => {
  const key1 = { prop: 'val1' };
  const key2 = { prop: 'val2' };
  checkPatches({ x: new Map([[key1, 4]]) }, (d) => {
    d.x.set(key1, 5);
    d.x.set(key2, 6);
  });
});

test('delete 1', () => {
  checkPatches({ x: { y: 4 } }, (d) => {
    // @ts-ignore
    delete d.x;
  });
});

test('delete 2', () => {
  checkPatches(new Map([['x', 1]]), (d) => {
    d.delete('x');
  });
});

test('delete 3', () => {
  checkPatches({ x: new Map([['y', 1]]) }, (d) => {
    d.x.delete('y');
  });
});

test('delete 5', () => {
  const key1 = { prop: 'val1' };
  const key2 = { prop: 'val2' };
  checkPatches(
    {
      x: new Map([
        [key1, 1],
        [key2, 2],
      ]),
    },
    (d) => {
      d.x.delete(key1);
      d.x.delete(key2);
    }
  );
});

test('delete 6', () => {
  checkPatches(new Set(['x', 1]), (d) => {
    d.delete('x');
  });
});

test('delete 7', () => {
  checkPatches({ x: new Set(['y', 1]) }, (d) => {
    d.x.delete('y');
  });
});

test('nested object (no changes)', () => {
  checkPatches({ a: { b: 1 } }, (d) => {
    // @ts-ignore
    d.x = d.a;
    // @ts-ignore
    delete d.a;
  });
});

test('nested change in object', () => {
  checkPatches(
    {
      a: { b: 1 },
    },
    (d) => {
      d.a.b++;
    }
  );
});

test('nested change in map', () => {
  checkPatches(new Map([['a', new Map([['b', 1]])]]), (d) => {
    // @ts-ignore
    d.get('a').set('b', 2);
  });
});

test('nested change in array', () => {
  checkPatches([[{ b: 1 }]], (d) => {
    d[0][0].b++;
  });
});

test('nested map (no changes)', () => {
  checkPatches(new Map([['a', new Map([['b', 1]])]]), (d) => {
    // @ts-ignore
    d.set('x', d.get('a'));
    d.delete('a');
  });
});

test('nested object (with changes)', () => {
  checkPatches({ a: { b: 1, c: 1 } }, (d) => {
    let a = d.a;
    a.b = 2; // change
    // @ts-ignore
    delete a.c; // delete
    // @ts-ignore
    a.y = 2; // add

    // rename
    // @ts-ignore
    d.x = a;
    // @ts-ignore
    delete d.a;
  });
});

test('nested map (with changes)', () => {
  checkPatches(
    new Map([
      [
        'a',
        new Map([
          ['b', 1],
          ['c', 1],
        ]),
      ],
    ]),
    (d) => {
      let a = d.get('a') as any;
      a.set('b', 2); // change
      a.delete('c'); // delete
      a.set('y', 2); // add

      // rename
      d.set('x', a);
      d.delete('a');
    }
  );
});

test('deeply nested object (with changes)', () => {
  checkPatches({ a: { b: { c: 1, d: 1 } } }, (d) => {
    let b = d.a.b;
    b.c = 2; // change
    // @ts-ignore
    delete b.d; // delete
    // @ts-ignore
    b.y = 2; // add

    // rename
    // @ts-ignore
    d.a.x = b;
    // @ts-ignore
    delete d.a.b;
  });
});

test('deeply nested map (with changes)', () => {
  checkPatches(
    new Map([
      [
        'a',
        new Map([
          [
            'b',
            new Map([
              ['c', 1],
              ['d', 1],
            ]),
          ],
        ]),
      ],
    ]),
    (d) => {
      let b = (d.get('a') as any).get('b') as any;
      b.set('c', 2); // change
      b.delete('d'); // delete
      b.set('y', 2); // add

      // rename
      d.get('a')!.set('x', b);
      d.get('a')!.delete('b');
    }
  );
});

test('minimum amount of changes', () => {
  checkPatches({ x: 3, y: { a: 4 }, z: 3 }, (d) => {
    d.y.a = 4;
    // @ts-ignore
    d.y.b = 5;
    Object.assign(d, { x: 4, y: { a: 2 } });
  });
});

test('arrays - prepend', () => {
  checkPatches({ x: [1, 2, 3] }, (d) => {
    d.x.unshift(4);
  });
});

test('arrays - multiple prepend', () => {
  checkPatches({ x: [1, 2, 3] }, (d) => {
    d.x.unshift(4);
    d.x.unshift(5);
    // 4,5,1,2,3
  });
});

test('arrays - splice middle', () => {
  checkPatches({ x: [1, 2, 3] }, (d) => {
    d.x.splice(1, 1);
  });
});

test('arrays - multiple splice', () => {
  checkPatches([0, 1, 2, 3, 4, 5, 0], (d) => {
    d.splice(4, 2, 3);
    // [0,1,2,3,3,0]
    d.splice(1, 2, 3);
    // [0,3,3,3,0]
    expect(d.slice()).toEqual([0, 3, 3, 3, 0]);
  });
});

test('arrays - modify and shrink', () => {
  checkPatches({ x: [1, 2, 3] }, (d) => {
    d.x[0] = 4;
    d.x.length = 2;
    // [0, 2]
  });
});

test('arrays - prepend then splice middle', () => {
  checkPatches({ x: [1, 2, 3] }, (d) => {
    d.x.unshift(4);
    d.x.splice(2, 1);
    // 4, 1, 3
  });
});

test('arrays - splice middle then prepend', () => {
  checkPatches({ x: [1, 2, 3] }, (d) => {
    d.x.splice(1, 1);
    d.x.unshift(4);
    // [4, 1, 3]
  });
});

test('arrays - truncate', () => {
  checkPatches({ x: [1, 2, 3] }, (d) => {
    d.x.length -= 2;
  });
});

test('arrays - pop twice', () => {
  checkPatches({ x: [1, 2, 3] }, (d) => {
    d.x.pop();
    d.x.pop();
  });
});

test('arrays - push multiple', () => {
  // These patches were more optimal pre immer 7, but not always correct
  checkPatches({ x: [1, 2, 3] }, (d) => {
    d.x.push(4, 5);
  });
});

test('arrays - splice (expand)', () => {
  // These patches were more optimal pre immer 7, but not always correct
  checkPatches({ x: [1, 2, 3] }, (d) => {
    d.x.splice(1, 1, 4, 5, 6); // [1,4,5,6,3]
  });
});

test('arrays - splice (shrink)', () => {
  // These patches were more optimal pre immer 7, but not always correct
  checkPatches({ x: [1, 2, 3, 4, 5] }, (d) => {
    d.x.splice(1, 3, 6); // [1, 6, 5]
  });
});

test('arrays - delete', () => {
  checkPatches(
    {
      x: [
        { a: 1, b: 2 },
        { c: 3, d: 4 },
      ],
    },
    (d) => {
      delete d.x[1].c;
    }
  );
});

test('sets - add - 1', () => {
  checkPatches(new Set([1]), (d) => {
    d.add(2);
  });
});

test('sets - add, delete, add - 1', () => {
  checkPatches(new Set([1]), (d) => {
    d.add(2);
    d.delete(2);
    d.add(2);
  });
});

test('sets - add, delete, add - 2', () => {
  checkPatches(new Set([2, 1]), (d) => {
    d.add(2);
    d.delete(2);
    d.add(2);
  });
});

test('sets - mutate - 1', () => {
  const findById = (set: any, id: any) => {
    for (const item of set) {
      if (item.id === id) return item;
    }
  };
  checkPatches(
    new Set([
      { id: 1, val: 'We' },
      { id: 2, val: 'will' },
    ]),
    (d) => {
      const obj1 = findById(d, 1);
      const obj2 = findById(d, 2);
      obj1.val = 'rock';
      obj2.val = 'you';
    }
  );
});

test('arrays - splice should should result in remove op.', () => {
  // These patches were more optimal pre immer 7, but not always correct
  checkPatches([1, 2], (d) => {
    d.splice(1, 1);
  });
});

test('arrays - NESTED splice should should result in remove op.', () => {
  // These patches were more optimal pre immer 7, but not always correct
  checkPatches({ a: { b: { c: [1, 2] } } }, (d) => {
    d.a.b.c.splice(1, 1);
  });
});

test('same value replacement - 1', () => {
  checkPatches({ x: { y: 3 } }, (d) => {
    const a = d.x;
    d.x = a;
  });
});

test('same value replacement - 2', () => {
  checkPatches([1, { x: 1 }, 3], (d) => {
    const a = d[1];
    // @ts-ignore
    d[1] = 4;
    d[1] = a;
  });
});

test('set value and pop the value (array) - 2', () => {
  checkPatches([1, { x: 1 }, {}], (d) => {
    // @ts-ignore
    d.unshift(d[2]);
    d.pop();
  });
});

test('same value replacement(array) - 2', () => {
  checkPatches([1, { x: 1 }, 3], (d) => {
    const a = d[1];
    // @ts-ignore
    d[1] = 4;
    d[1] = a;
  });
});

test('same value replacement(array) - 2', () => {
  checkPatches([1, 2, { x: 1 }], (d) => {
    const a = d[2];
    // @ts-ignore
    d.pop();
    d.push(a);
  });
});

test('same value replacement(set) - 2', () => {
  checkPatches(new Set([1, 2, {}]), (d) => {
    const [a] = Array.from(d.keys()).slice(-1);
    // @ts-ignore
    d.delete(a);
    d.add(a);
  });
});

test('same value replacement(map) - 2', () => {
  checkPatches(
    new Map([
      [1, { x: 1 }],
      [2, { x: 1 }],
      [3, { x: 1 }],
    ]),
    (d) => {
      const a = d.get(1);
      // @ts-ignore
      d.set(1, 4);
      // @ts-ignore
      d.set(1, a);
    }
  );
});

test('same value replacement - 3', () => {
  checkPatches({ x: 3 }, (d) => {
    d.x = 3;
  });
});

test('same value replacement - 4', () => {
  checkPatches({ x: 3 }, (d) => {
    d.x = 4;
    d.x = 3;
  });
});

test('same value replacement - 4', () => {
  checkPatches({ x: 3 }, (d) => {
    d.x = 4;
    d.x = 3;
  });
});

test('same value replacement - 5', () => {
  checkPatches(new Map([['x', 3]]), (d) => {
    d.set('x', 4);
    d.set('x', 3);
  });
});

test('same value replacement - 6', () => {
  checkPatches(new Set(['x', 3]), (d) => {
    d.delete('x');
    d.add('x');
  });
});

test('simple delete', () => {
  checkPatches({ x: 2 }, (d) => {
    // @ts-ignore
    delete d.x;
  });
});

test('change then delete property', () => {
  checkPatches(
    {
      x: 1,
    },
    (d) => {
      d.x = 2;
      // @ts-ignore
      delete d.x;
    }
  );
});

test('#468', () => {
  const item = { id: 1 };
  const state = [item];
  checkPatches(state, (draft) => {
    draft[0].id = 2;
    draft[1] = item;
  });
});

test('#648 assigning object to itself should not change patches', () => {
  const input = {
    obj: {
      value: 200,
    },
  };
  checkPatches(input, (draft) => {
    draft.obj.value = 1;
    draft.obj = draft.obj;
  });
});

test('#876 Ensure empty patch set for atomic set+delete on Map', () => {
  {
    checkPatches(new Map([['foo', 'baz']]), (draft) => {
      draft.set('foo', 'bar');
      draft.delete('foo');
    });
  }

  {
    checkPatches(new Map(), (draft) => {
      draft.set('foo', 'bar');
      draft.delete('foo');
    });
  }
});

test('#879 delete item from array', () => {
  checkPatches([1, 2, 3], (draft) => {
    delete draft[1];
  });
});

test('#879 delete item from array - 2', () => {
  checkPatches([1, 2, 3], (draft) => {
    delete draft[2];
  });
});

test('#466 mapChangeBug', () => {
  checkPatches(
    {
      map: new Map([
        [
          'a',
          new Map([
            ['b', true],
            ['c', true],
            ['d', true],
          ]),
        ],
        ['b', new Map([['a', true]])],
        ['c', new Map([['a', true]])],
        ['d', new Map([['a', true]])],
      ]),
    },
    (draft) => {
      const aMap = draft.map.get('a');
      // @ts-ignore
      aMap.forEach((_, other) => {
        const otherMap = draft.map.get(other);
        // @ts-ignore
        otherMap.delete('a');
      });
    }
  );
});

test('undefined as a map key', () => {
  const a = undefined;
  const data = {
    foo: new Map([[a, { x: 1 }]]),
  };

  const [, patches] = create(
    data,
    (draft) => {
      draft.foo.get(a)!.x = 2;
    },
    {
      enablePatches: true,
    }
  );
  expect(patches).toEqual([
    { op: 'replace', path: ['foo', undefined, 'x'], value: 2 },
  ]);
});

test('patches issue', () => {
  checkPatches(
    {
      foo: {
        bar: {
          a: 1,
        },
      },
      f: {},
    },
    (draft) => {
      // @ts-ignore
      draft.e = { ffff: draft.foo.bar };
      // @ts-ignore
      delete draft.foo.bar;
      // @ts-ignore
      draft.e.ffff.a = 2;
    }
  );
});

test('different options - apply patches', () => {
  create(
    { a: { b: 1 } },
    (draft) => {
      expect(() => {
        apply(draft, [], {
          enableAutoFreeze: false,
        });
      }).toThrow(`Cannot apply patches with options to a draft.`);
    },
    { enableAutoFreeze: true }
  );
});

test('set - patches', () => {
  expect(() => {
    apply(new Set([0]), [{ op: 'replace', path: [0], value: 1 }]);
  }).toThrow(`Cannot apply replace patch to set.`);
});

test('array - patches', () => {
  const arr = apply([1, 2, 3], [{ op: 'remove', path: [0] }]);
  expect(arr).toEqual([2, 3]);
});

test('unexpected - patches', () => {
  expect(() => {
    apply({ a: {} }, [{ op: 'replace', path: ['__proto__', 'a'], value: 1 }]);
  }).toThrow(
    `Patching reserved attributes like __proto__ and constructor is not allowed.`
  );
  expect(() => {
    apply({ a: {} }, [{ op: 'replace', path: ['constructor', 'a'], value: 1 }]);
  }).toThrow(
    `Patching reserved attributes like __proto__ and constructor is not allowed.`
  );
});

test('a patch cannot set a prototype through the last segment of its path', () => {
  const paths = [['__proto__'], '/__proto__', ['user', '__proto__']];
  for (const options of [undefined, { mutable: true }]) {
    for (const path of paths) {
      const target: any = { role: 'reader', user: { role: 'reader' } };
      expect(() =>
        apply(
          target,
          [{ op: 'add', path, value: { admin: true } }] as Patches,
          options
        )
      ).toThrow(
        `Patching reserved attributes like __proto__ and constructor is not allowed.`
      );
      expect(Object.getPrototypeOf(target)).toBe(Object.prototype);
      expect(Object.getPrototypeOf(target.user)).toBe(Object.prototype);
      expect(target.admin).toBeUndefined();
      expect(target.user.admin).toBeUndefined();
    }
  }
  // A Map key named `__proto__` is an ordinary key.
  const map = apply(new Map(), [{ op: 'add', path: ['__proto__'], value: 1 }]);
  expect(map.get('__proto__')).toBe(1);
});

test.each([false, true])(
  'coercible terminal keys cannot set a prototype (mutable: %s)',
  (mutable) => {
    const keys = [
      ['__proto__'],
      Object('__proto__'),
      { [Symbol.toPrimitive]: () => '__proto__' },
      Object.assign(() => {}, { toString: () => '__proto__' }),
    ];
    for (const key of keys) {
      for (const child of [{ count: 0 }, [0]]) {
        const target = { child };
        const prototype = Object.getPrototypeOf(child);
        const patches = [
          { op: 'replace', path: ['child', key], value: { injected: true } },
        ] as unknown as Patches;
        expect(() => apply(target, patches, { mutable })).toThrow(
          'Patching reserved attributes like __proto__ and constructor is not allowed.'
        );
        expect(Object.getPrototypeOf(child)).toBe(prototype);
        expect((child as any).injected).toBeUndefined();
        expect(patches[0].path[1]).toBe(key);
      }
    }
  }
);

test.each([false, true])(
  'property keys are converted once before checking and writing (mutable: %s)',
  (mutable) => {
    const calls: string[] = [];
    const key = {
      [Symbol.toPrimitive](hint: string) {
        calls.push(hint);
        return calls.length === 1 ? 'value' : '__proto__';
      },
    };
    const target = { value: 0 };
    const patches = [
      { op: 'replace', path: [key], value: 2 },
    ] as unknown as Patches;
    const result = apply(target, patches, { mutable });
    expect(calls).toEqual(['string']);
    const state = mutable ? target : result;
    expect(state).toEqual({ value: 2 });
    expect(Object.getPrototypeOf(state)).toBe(Object.prototype);
    expect(patches[0].path[0]).toBe(key);
  }
);

test.each([false, true])(
  'coercible symbol keys work at intermediate and terminal positions (mutable: %s)',
  (mutable) => {
    const symbol = Symbol('key');
    const key = Object(symbol);
    const target = { [symbol]: { [symbol]: 0 } };
    const patches = [
      { op: 'replace', path: [key, key], value: 1 },
    ] as unknown as Patches;
    const result = apply(target, patches, { mutable });
    expect(mutable ? target : result).toEqual({ [symbol]: { [symbol]: 1 } });
    expect(patches[0].path).toEqual([key, key]);
  }
);

test.each([false, true])(
  'terminal Map keys and array splice indices keep their native semantics (mutable: %s)',
  (mutable) => {
    const key = {
      [Symbol.toPrimitive]() {
        throw new Error('Map key must not be converted');
      },
    };
    const map = new Map([[key, 0]]);
    const mapped = apply(
      map,
      [{ op: 'replace', path: [key], value: 1 }] as unknown as Patches,
      {
        mutable,
      }
    );
    expect((mutable ? map : mapped)!.get(key)).toBe(1);

    const hints: string[] = [];
    const index = {
      [Symbol.toPrimitive](hint: string) {
        hints.push(hint);
        return hint === 'number' ? 1 : '__proto__';
      },
    };
    const array = [0, 1];
    const added = apply(
      array,
      [{ op: 'add', path: [index], value: 2 }] as unknown as Patches,
      {
        mutable,
      }
    );
    const state = mutable ? array : added!;
    expect(state).toEqual([0, 2, 1]);
    const removed = apply(
      state,
      [{ op: 'remove', path: [index] }] as unknown as Patches,
      {
        mutable,
      }
    );
    expect(mutable ? state : removed).toEqual([0, 1]);
    expect(hints).toEqual(['number', 'number']);
  }
);

test('type check', () => {
  let state: Record<string, unknown>;
  let patches: Patches | undefined;

  [state, patches] = create(
    {} as any,
    (draft) => {
      draft.a = 1;
      draft.b = draft.a;
    },
    {
      enablePatches: true,
    }
  );
  expect(state).toEqual({ a: 1, b: 1 });
  const key = patches![0].path;
  expect(Array.isArray(key)).toBeTruthy();
});

test('merge multiple patches', () => {
  const arr = [1];
  const [state, patches, inversePatches] = create(
    arr,
    (draft) => {
      draft.push(2);
      draft.push(999);
    },
    {
      enablePatches: true,
    }
  );
  const [state1, patches1, inversePatches1] = create(
    state,
    (draft) => {
      draft.push(3);
      draft.push(4);
    },
    {
      enablePatches: true,
    }
  );

  const [state2, patches2, inversePatches2] = create(
    state1,
    (draft) => {
      draft.shift();
      draft.push(4);
    },
    {
      enablePatches: true,
    }
  );

  const patches0 = [...patches, ...patches1, ...patches2];
  // !!! need to reverse patches
  const inversePatches0 = [
    ...inversePatches2,
    ...inversePatches1,
    ...inversePatches,
  ];

  const nextState = apply(arr, patches0);
  expect(nextState).toEqual(state2);
  const prevState = apply(state2, inversePatches0);
  expect(prevState).toEqual(arr);

  const errorPrevState = apply(state2, [
    ...inversePatches,
    ...inversePatches1,
    ...inversePatches2,
  ]);
  expect(errorPrevState).not.toEqual(arr);
});

test('#64 - Invalid inversePatches when array length changes', () => {
  checkPatches(
    [0, 1, 2, 3].map((id) => ({ id })),
    (draft) => {
      draft[3].id *= 10;
      draft.splice(0, 1);
    }
  );
});

test('modify deep object', () => {
  const a = { a: 1 };
  const b = { b: 2 };
  const c = { c: 3 };
  const set1 = new Set([a, b]);
  const set2 = new Set([c]);
  // @ts-ignore
  const map = new Map([
    ['set1', set1],
    ['set2', set2],
  ]);
  const base = { map };

  function first(set: any) {
    return Array.from(set.values())[0];
  }

  function second(set: any) {
    return Array.from(set.values())[1];
  }

  const fn = (draft: any) => {
    const v = first(draft.map.get('set1'));
    expect(original(v)).toBe(a);
    expect(v).toEqual(a);
    expect(v).not.toBe(a);
    // @ts-ignore
    v.a++;
  };

  const [state, patches, inversePatches] = create(base, fn, {
    enablePatches: true,
  });

  const prevState = apply(state, inversePatches);
  expect(prevState).toEqual(base);
  const nextState = apply(base, patches);
  expect(nextState).toEqual(state);

  expect(state).toMatchSnapshot();
  expect(patches).toMatchSnapshot();
  expect(inversePatches).toMatchSnapshot();

  expect(a.a).toBe(1);
  expect(base.map.get('set1')).toBe(set1);
  expect(first(base.map.get('set1'))).toBe(a);
  expect(state).not.toBe(base);
  expect(state.map).not.toBe(base.map);
  expect(state.map.get('set1')).not.toBe(base.map.get('set1'));
  expect(second(base.map.get('set1'))).toBe(b);
  expect(base.map.get('set2')).toBe(set2);
  expect(first(state.map.get('set1'))).toEqual({ a: 2 });
});

test('#70 - deep copy patches with Custom Set/Map', () => {
  class CustomSet<T> extends Set<T> {}
  class CustomMap<K, V> extends Map<K, V> {}
  const baseState = {
    map: new CustomMap<any, any>(),
    set: new CustomSet<any>(),
  };
  const [state, patches, inversePatches] = create(
    baseState,
    (draft) => {
      draft.map = new CustomMap<any, any>([[1, 1]]);
      draft.set = new CustomSet<any>([1]);
    },
    {
      enablePatches: true,
    }
  );
  const nextState = apply(baseState, patches);
  expect(patches[0].value).toBeInstanceOf(CustomMap);
  expect(patches[1].value).toBeInstanceOf(CustomSet);
  expect(nextState).toEqual(state);
  const prevState = apply(state, inversePatches);
  expect(inversePatches[0].value).toBeInstanceOf(CustomMap);
  expect(inversePatches[1].value).toBeInstanceOf(CustomSet);
  expect(prevState).toEqual(baseState);
});

test('array - update', () => {
  const obj = {
    a: Array.from({ length: 20 }, (_, i) => ({ i })),
    o: { b: { c: 1 } },
  };
  checkPatches(obj, (d) => {
    d.a.splice(0, 1);
  });

  checkPatches(obj, (d) => {
    // d.o.b.c++;
    // @ts-ignore
    d.a.splice(0, 1, { i: d.o.b });
    // @ts-ignore
    delete d.o.b;
  });

  checkPatches(obj, (d) => {
    d.o.b.c++;
    // @ts-ignore
    d.a.splice(0, 1, { i: -1 }, { i: d.o.b });
    // @ts-ignore
    delete d.o.b;
  });

  checkPatches(obj, (d) => {
    d.a.shift();
  });

  checkPatches(obj, (d) => {
    d.a.shift();
    d.a[0].i += 1;
    d.a[10].i += 1;
  });

  checkPatches(obj, (d) => {
    d.a[10].i += 1;
    d.a.splice(0, 1);
    d.a[0].i += 1;
  });

  checkPatches(obj, (d) => {
    d.a[10].i += 1;
    d.a.shift();
    d.a[0].i += 1;
  });

  checkPatches(obj, (d) => {
    d.a.unshift({ i: -1 });
  });

  checkPatches(obj, (d) => {
    d.o.b.c++;
    // @ts-ignore
    d.a.unshift({ i: -1 }, { i: d.o.b });
    // @ts-ignore
    delete d.o.b;
  });

  checkPatches(obj, (d) => {
    d.a[10].i += 1;
    d.a.unshift({ i: -1 });
    d.a[2].i += 1;
  });

  checkPatches(obj, (d) => {
    d.a.reverse();
  });

  checkPatches(obj, (d) => {
    d.a[10].i += 1;
    d.a.reverse();
    d.a[2].i += 1;
  });

  checkPatches(obj, (d) => {
    const a = d.a[0];
    d.a.shift();
    d.a[10].i += 1;
    a.i += 1;
    d.a.push(a);
  });
});

test('array - update with prototype', () => {
  const obj = {
    a: Array.from({ length: 20 }, (_, i) => ({ i })),
    o: { b: { c: 1 } },
  };
  checkPatches(obj, (d) => {
    Array.prototype.splice.call(d.a, 0, 1);
  });

  checkPatches(obj, (d) => {
    d.o.b.c++;
    // @ts-ignore
    Array.prototype.splice.call(d.a, 0, 1, { i: -1 }, { i: d.o.b });
    // @ts-ignore
    delete d.o.b;
  });

  checkPatches(obj, (d) => {
    Array.prototype.shift.call(d.a);
  });

  checkPatches(obj, (d) => {
    Array.prototype.shift.call(d.a);
    d.a[0].i += 1;
    d.a[10].i += 1;
  });

  checkPatches(obj, (d) => {
    d.a[10].i += 1;
    Array.prototype.splice.call(d.a, 0, 1);
    d.a[0].i += 1;
  });

  checkPatches(obj, (d) => {
    d.a[10].i += 1;
    Array.prototype.shift.call(d.a);
    d.a[0].i += 1;
  });

  checkPatches(obj, (d) => {
    Array.prototype.unshift.call(d.a, { i: -1 });
  });

  checkPatches(obj, (d) => {
    d.o.b.c++;
    // @ts-ignore
    Array.prototype.unshift.call(d.a, { i: -1 }, { i: d.o.b });
    // @ts-ignore
    delete d.o.b;
  });

  checkPatches(obj, (d) => {
    d.a[10].i += 1;
    Array.prototype.unshift.call(d.a, { i: -1 });
    d.a[2].i += 1;
  });

  checkPatches(obj, (d) => {
    Array.prototype.reverse.call(d.a);
  });

  checkPatches(obj, (d) => {
    d.a[10].i += 1;
    Array.prototype.reverse.call(d.a);
    d.a[2].i += 1;
  });
});

test('array - update primitive', () => {
  const obj = {
    a: Array.from({ length: 20 }, (_, i) => i),
    o: { b: { c: 1 } },
  };
  checkPatches(obj, (d) => {
    d.a.splice(0, 1);
  });

  checkPatches(obj, (d) => {
    d.o.b.c++;
    // @ts-ignore
    d.a.splice(0, 1, { i: -1 }, { i: d.o.b });
    // @ts-ignore
    delete d.o.b;
  });

  checkPatches(obj, (d) => {
    d.a.shift();
  });

  checkPatches(obj, (d) => {
    d.a.shift();
    d.a[0] += 1;
    d.a[10] += 1;
  });

  checkPatches(obj, (d) => {
    d.a[10] += 1;
    d.a.splice(0, 1);
    d.a[0] += 1;
  });

  checkPatches(obj, (d) => {
    d.a[10] += 1;
    d.a.shift();
    d.a[0] += 1;
  });

  checkPatches(obj, (d) => {
    d.a.unshift(100);
  });

  checkPatches(obj, (d) => {
    d.o.b.c++;
    // @ts-ignore
    d.a.unshift(0, { i: d.o.b });
    // @ts-ignore
    delete d.o.b;
  });

  checkPatches(obj, (d) => {
    d.a[10] += 1;
    d.a.unshift(-1);
    d.a[2] += 1;
  });

  checkPatches(obj, (d) => {
    d.a.reverse();
  });

  checkPatches(obj, (d) => {
    d.a[10] += 1;
    d.a.reverse();
    d.a[2] += 1;
  });
});

test('base - mutate', () => {
  const baseState = {
    a: {
      c: 1,
    },
  };
  const [state, patches, inversePatches] = create(
    baseState,
    (draft) => {
      draft.a.c = 2;
    },
    {
      enablePatches: true,
    }
  );
  expect(state).toEqual({ a: { c: 2 } });
  expect({ patches, inversePatches }).toEqual({
    patches: [
      {
        op: 'replace',
        path: ['a', 'c'],
        value: 2,
      },
    ],
    inversePatches: [
      {
        op: 'replace',
        path: ['a', 'c'],
        value: 1,
      },
    ],
  });
  const nextState = apply(baseState, patches);
  expect(nextState).toEqual({ a: { c: 2 } });
  expect(baseState).toEqual({ a: { c: 1 } });

  const result = apply(baseState, patches, {
    mutable: true,
  });
  expect(baseState).toEqual({ a: { c: 2 } });
  expect(result).toBeUndefined();
});

describe('array methods on the draft copy', () => {
  // Plain arrays run `shift`, `unshift`, `splice`, `reverse`, searches and
  // primitive sorts natively on the draft's copy: removed and moved elements
  // are drafted lazily and keep their original index as patch key. Besides the
  // snapshots of `checkPatches`, each scenario replays without length patches,
  // with string paths, and with auto-freeze, which take other patch and
  // finalization paths.
  function checkArrayPatches<T>(data: T, fn: (draft: T) => void) {
    checkPatches(data, fn);
    for (const options of [
      { enablePatches: { arrayLengthAssignment: false } },
      { enablePatches: { pathAsArray: false } },
      { enablePatches: true, enableAutoFreeze: true },
    ]) {
      const base = structuredClone(data);
      const [state, patches, inversePatches] = create(
        base as any,
        fn as any,
        options as any
      ) as any;
      const expected = deepClone(data);
      fn(expected);
      expect(state).toEqual(expected);
      expect(apply(base as any, patches)).toEqual(state);
      expect(apply(state, inversePatches)).toEqual(data);
    }
  }

  const row = (id: number) => ({ id, nested: { value: id }, tags: [id] });
  const rows = (length: number) => Array.from({ length }, (_, id) => row(id));

  test('drafts created before native moves are edited afterwards', () => {
    checkArrayPatches({ list: rows(12) }, (d) => {
      const fifth = d.list[5];
      const last = d.list[11];
      d.list.reverse();
      d.list.shift();
      d.list.splice(3, 0, row(-1));
      fifth.nested.value = 50;
      last.tags.push(110);
      d.list.unshift(last);
    });
  });

  test('removed elements are edited and re-inserted at other positions', () => {
    checkArrayPatches({ list: rows(8) }, (d) => {
      const first = d.list.shift()!;
      const [second, third] = d.list.splice(2, 2);
      first.nested.value = 100;
      third.tags.push(-1);
      d.list.splice(1, 0, third, first);
      d.list.push(second);
      second.id = 99;
    });
  });

  test('every element is shifted out and pushed back in reverse order', () => {
    checkArrayPatches({ list: rows(4) }, (d) => {
      const removed: ReturnType<typeof row>[] = [];
      while (d.list.length > 0) removed.push(d.list.shift()!);
      removed.reverse();
      removed[1].nested.value = 11;
      d.list.push(...removed);
    });
  });

  test('shared references are moved and edited through one path', () => {
    const shared = row(1);
    checkArrayPatches(
      { list: [shared, row(2), shared], other: shared },
      (d) => {
        d.list.unshift(row(0));
        d.list.forEach((item) => item.id);
        d.list[3].nested.value = 30;
        d.list.reverse();
        d.other.tags.push(10);
      }
    );
  });

  test('methods of two arrays interleave', () => {
    checkArrayPatches({ a: rows(5), b: rows(3) }, (d) => {
      d.a.unshift(d.b.shift()!);
      d.b.splice(1, 0, ...d.a.splice(2, 2));
      d.a[0].nested.value = 7;
      d.b.reverse();
      d.b[0].tags.push(8);
    });
  });

  test('native moves mixed with proxy-path methods', () => {
    checkArrayPatches({ list: rows(10) }, (d) => {
      d.list.unshift(row(20));
      d.list.sort((x, y) => y.id - x.id);
      d.list.splice(4, 1);
      d.list.copyWithin(0, 5, 7);
      d.list.fill(row(30), 8, 9);
      d.list.reverse();
      d.list[1].nested.value = -5;
    });
  });

  test('assignments past the end and length changes between native moves', () => {
    checkArrayPatches({ list: rows(4) as any[] }, (d) => {
      d.list.reverse();
      d.list[6] = row(6);
      d.list.reverse();
      d.list.length = 5;
      d.list.unshift(row(-1));
      d.list[4].nested.value = 22;
    });
  });

  test('undefined elements move natively', () => {
    checkArrayPatches(
      { list: [{ id: 0 }, undefined, { id: 2 }, undefined] as any[] },
      (d) => {
        d.list.reverse();
        d.list.splice(1, 1, undefined, { id: 5 });
        d.list.unshift(undefined);
        d.list[3].id = 20;
        d.list[5].id = 21;
      }
    );
  });

  test('nested arrays are moved inside moved rows', () => {
    checkArrayPatches(
      {
        grid: [
          [0, 1, 2],
          [3, 4],
          [5, 6, 7, 8],
        ],
      },
      (d) => {
        d.grid.reverse();
        d.grid[0].reverse();
        d.grid[1].splice(0, 1, 40, 41);
        d.grid.unshift([9]);
        d.grid[3].shift();
        d.grid[0].push(10);
      }
    );
  });

  test('a root array is moved and its elements edited', () => {
    checkArrayPatches(rows(6), (d) => {
      const third = d[2];
      d.reverse();
      d.splice(1, 2);
      third.nested.value = 30;
      d.unshift(d.pop()!);
    });
  });

  test('calls that change nothing are mixed with edits', () => {
    const shared = row(1);
    checkArrayPatches(
      { nums: [1, 2, 3], list: rows(3), palindrome: [shared, row(2), shared] },
      (d) => {
        d.nums.sort((x, y) => x - y);
        d.list.splice(1, 1, d.list[1]);
        d.list.reverse();
        d.list.reverse();
        d.list[1].nested.value = 10;
        d.palindrome.reverse();
        d.palindrome[0].id = 5;
        d.nums.unshift();
        d.nums.splice(1, 0);
      }
    );
  });

  test('searches drive removals after moves', () => {
    checkArrayPatches({ list: rows(8) }, (d) => {
      const item = d.list[3];
      d.list.reverse();
      d.list.splice(d.list.indexOf(item), 1);
      d.list.unshift(item);
      item.nested.value = 33;
      d.list.splice(d.list.lastIndexOf(d.list[5]), 1);
      expect(d.list.includes(item)).toBe(true);
    });
  });

  test('splice with negative and oversized arguments, then edit the tail', () => {
    checkArrayPatches({ list: rows(9) }, (d) => {
      d.list.splice(-3, 10, row(90), row(91));
      d.list.splice(-100, 1);
      d.list.splice(2, 0, ...d.list.splice(4, 2));
      d.list[d.list.length - 1].nested.value = 1;
      d.list.splice(1, 2, d.list[2], d.list[1]);
    });
  });

  test('arrays inside Map values move natively', () => {
    checkArrayPatches(
      {
        map: new Map([
          ['a', rows(4)],
          ['b', rows(2)],
        ]),
      },
      (d) => {
        const a = d.map.get('a')!;
        a.reverse();
        a[0].nested.value = 9;
        d.map.get('b')!.unshift(a.shift()!);
        d.map.set('c', a.splice(0, 1));
      }
    );
  });

  test('a draft moved into a wrapper and the array moved again', () => {
    checkArrayPatches({ list: rows(5) as any[] }, (d) => {
      const moved = d.list[3];
      d.list.splice(-2, 0, { id: 99, wrapped: moved });
      d.list.reverse();
      moved.nested.value = 30;
      d.list.push({ wrapped: d.list[0] });
      d.list.shift();
    });
  });

  test('a longer array is moved at both ends and edited in the middle', () => {
    checkArrayPatches({ list: rows(30) }, (d) => {
      d.list.splice(15, 1);
      d.list.shift();
      d.list.push(row(30));
      d.list[20].nested.value = -20;
      d.list.splice(5, 0, row(-5));
      d.list[3].tags.push(3);
      d.list.unshift(d.list.pop()!);
    });
  });

  test('primitive sorts between native moves', () => {
    checkArrayPatches(
      { nums: [5, 3, 9, 1, 7], words: ['b', undefined, 'a', 'c'] as any[] },
      (d) => {
        d.nums.unshift(4);
        d.nums.sort((x, y) => x - y);
        d.nums.splice(2, 1, 8, 6);
        d.nums.sort();
        d.nums.reverse();
        d.words.sort();
        d.words.shift();
        d.words.reverse();
      }
    );
  });
});

describe('patch values that apply() copies', () => {
  test('own symbol keys are copied', () => {
    const key = Symbol('key');
    const flag = Symbol('flag');
    const empty = Symbol('empty');
    const base: any = { item: null };
    const [state, patches] = create(
      base,
      (draft: any) => {
        draft.item = { [key]: { deep: 1 }, [flag]: true, [empty]: null, x: 1 };
      },
      { enablePatches: true }
    );
    const next = apply(base, patches);
    expect(next.item[key]).toStrictEqual({ deep: 1 });
    expect(next.item[key]).not.toBe(state.item[key]);
    expect(next.item[flag]).toBe(true);
    expect(next.item[empty]).toBeNull();
    expect(next).toStrictEqual(state);
  });

  test('an own __proto__ key stays a data property', () => {
    const value = JSON.parse('{"__proto__":{"flag":1},"x":2}');
    const base: any = { item: null };
    const [state, patches] = create(
      base,
      (draft: any) => {
        draft.item = value;
      },
      { enablePatches: true }
    );
    const next = apply(base, patches);
    expect(Object.getPrototypeOf(next.item)).toBe(Object.prototype);
    expect(next.item.flag).toBeUndefined();
    expect(Object.getOwnPropertyDescriptor(next.item, '__proto__')).toEqual({
      value: { flag: 1 },
      writable: true,
      enumerable: true,
      configurable: true,
    });
    expect(next.item).not.toBe(state.item);
    expect(next.item.x).toBe(2);
  });

  test('nested values are copied, not shared', () => {
    const base: any = { item: null };
    const [state, patches] = create(
      base,
      (draft: any) => {
        draft.item = {
          list: [{ id: 1 }],
          map: new Map([['a', { v: 1 }]]),
          set: new Set([1]),
          date: new Date(0),
        };
      },
      { enablePatches: true }
    );
    const next = apply(base, patches);
    expect(next).toStrictEqual(state);
    expect(next.item.list[0]).not.toBe(state.item.list[0]);
    expect(next.item.map.get('a')).not.toBe(state.item.map.get('a'));
    expect(next.item.set).not.toBe(state.item.set);
    expect(next.item.date).toBe(state.item.date);
  });
});

test('a Map key that is an array stays one path segment', () => {
  const key = ['key'];
  const nested = ['nested'];
  const gone = ['gone'];
  const base = new Map<string[], any>([
    [key, 1],
    [nested, { v: 1 }],
    [gone, 3],
  ]);
  const [state, patches, inversePatches] = create(
    base,
    (draft) => {
      draft.get(nested).v = 2;
      draft.set(key, 2);
      draft.delete(gone);
    },
    { enablePatches: true }
  );
  expect(patches).toStrictEqual([
    { op: 'replace', path: [nested, 'v'], value: 2 },
    { op: 'replace', path: [key], value: 2 },
    { op: 'remove', path: [gone] },
  ]);
  const next = apply(base, patches);
  expect([...next]).toStrictEqual([...state]);
  expect(next.get(key)).toBe(2);
  expect(next.has(gone)).toBe(false);
  const previous = apply(state, inversePatches);
  expect([...previous]).toStrictEqual([...base]);
  expect(previous.get(key)).toBe(1);
  expect(previous.get(gone)).toBe(3);
});

test('a patch path keeps Map keys that are objects as they are', () => {
  let conversions = 0;
  const keys = [
    Object.create(null),
    {
      [Symbol.toPrimitive]: () => {
        conversions += 1;
        return 'key';
      },
    },
  ];
  for (const key of keys) {
    const base = new Map<object, { value: number }>([[key, { value: 0 }]]);
    const [state, patches, inversePatches] = create(
      base,
      (draft) => {
        draft.get(key)!.value = 1;
      },
      { enablePatches: true }
    );
    expect(patches).toStrictEqual([
      { op: 'replace', path: [key, 'value'], value: 1 },
    ]);
    expect(apply(base, patches).get(key)).toEqual({ value: 1 });
    expect(apply(state, inversePatches).get(key)).toEqual({ value: 0 });
  }
  expect(conversions).toBe(0);
});

// The limit that the patches guide describes for Sets of objects.
test('Set patches remove object elements by identity', () => {
  const base = new Set<any>();
  const [state, patches, inversePatches] = create(
    base,
    (draft) => {
      draft.add({ x: 1 });
    },
    { enablePatches: true }
  );
  const undone = apply(state, inversePatches);
  expect(undone.size).toBe(0);
  const redone = apply(undone, patches);
  expect([...redone]).toStrictEqual([{ x: 1 }]);
  expect([...redone][0]).not.toBe([...state][0]);
  expect(apply(redone, inversePatches).size).toBe(1);
  const numbers = create(
    new Set([1]),
    (draft) => {
      draft.add(2);
    },
    { enablePatches: true }
  );
  const replayed = apply(new Set([1]), numbers[1]);
  expect([...apply(replayed, numbers[2])]).toStrictEqual([1]);
});
