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
      }).toThrowError(`Cannot apply patches with options to a draft.`);
    },
    { enableAutoFreeze: true }
  );
});

test('set - patches', () => {
  expect(() => {
    apply(new Set([0]), [{ op: 'replace', path: [0], value: 1 }]);
  }).toThrowError(`Cannot apply replace patch to set.`);
});

test('array - patches', () => {
  const arr = apply([1, 2, 3], [{ op: 'remove', path: [0] }]);
  expect(arr).toEqual([2, 3]);
});

test('unexpected - patches', () => {
  expect(() => {
    apply({ a: {} }, [{ op: 'replace', path: ['__proto__', 'a'], value: 1 }]);
  }).toThrowError(
    `Patching reserved attributes like __proto__ and constructor is not allowed.`
  );
  expect(() => {
    apply({ a: {} }, [{ op: 'replace', path: ['constructor', 'a'], value: 1 }]);
  }).toThrowError(
    `Patching reserved attributes like __proto__ and constructor is not allowed.`
  );
});
