'use strict';
import { apply, create, isDraft, safeReturn } from '../../src';

jest.setTimeout(1000);

const isProd = process.env.NODE_ENV === 'production';

function runPatchTest(
  base: any,
  producer: any,
  patches: any,
  inversePatches?: any,
  expectedResult?: any
) {
  let resultProxies, resultEs5;

  function runPatchTestHelper() {
    // @ts-ignore
    const [res, recordedPatches, recordedInversePatches] = create(
      base,
      producer,
      {
        enablePatches: true,
      }
    );

    if (expectedResult !== undefined)
      test('produced the correct result', () => {
        expect(res).toEqual(expectedResult);
      });

    test('produces the correct patches', () => {
      expect(recordedPatches).toEqual(patches);
      if (inversePatches)
        expect(recordedInversePatches).toEqual(inversePatches);
    });

    test('patches are replayable', () => {
      expect(apply(base, recordedPatches)).toEqual(res);
    });

    test('patches can be reversed', () => {
      expect(apply(res, recordedInversePatches)).toEqual(base);
    });

    return res;
  }

  describe(`proxy`, () => {
    // setUseProxies(true);
    resultProxies = runPatchTestHelper();
  });

  // describe(`es5`, () => {
  //   setUseProxies(false);
  //   resultEs5 = runPatchTestHelper();
  //   test('ES5 and Proxy implementation yield same result', () => {
  //     expect(resultEs5).toEqual(resultProxies);
  //   });
  // });

  return resultProxies;
}

describe('applyPatches', () => {
  it('mutates the base state when it is a draft', () => {
    create({ a: 1 }, (draft) => {
      // @ts-ignore
      const result = apply(draft, [{ op: 'replace', path: ['a'], value: 2 }]);
      expect(result).toBe(draft);
      expect(draft.a).toBe(2);
    });
  });
  it('produces a copy of the base state when not a draft', () => {
    const base = { a: 1 };
    // @ts-ignore
    const result = apply(base, [{ op: 'replace', path: ['a'], value: 2 }]);
    expect(result).not.toBe(base);
    expect(result.a).toBe(2);
    expect(base.a).toBe(1);
  });
  it('throws when `op` is not "add", "replace", nor "remove"', () => {
    expect(() => {
      const patch = { op: 'copy', from: [0], path: [1] };
      // @ts-ignore
      apply([2], [patch]);
    }).toThrowErrorMatchingSnapshot();
  });
  it('throws when `path` cannot be resolved', () => {
    // missing parent
    expect(() => {
      const patch = { op: 'add', path: ['a', 'b'], value: 1 };
      // @ts-ignore
      apply({}, [patch]);
    }).toThrowErrorMatchingSnapshot();

    // missing grand-parent
    expect(() => {
      const patch = { op: 'add', path: ['a', 'b', 'c'], value: 1 };
      // @ts-ignore
      apply({}, [patch]);
    }).toThrowErrorMatchingSnapshot();
  });
  it('applied patches cannot be modified', () => {
    // see also: https://github.com/immerjs/immer/issues/411
    const s0 = {
      items: [1],
    };

    const [s1, p1] = create(
      s0,
      (draft) => {
        draft.items = [];
      },
      {
        enablePatches: true,
      }
    );

    const replaceValueBefore = p1[0].value.slice();

    const [s2, p2] = create(
      s1,
      (draft) => {
        draft.items.push(2);
      },
      {
        enablePatches: true,
      }
    );

    apply(s0, [...p1, ...p2]);

    const replaceValueAfter = p1[0].value.slice();

    expect(replaceValueAfter).toStrictEqual(replaceValueBefore);
  });
});

describe('simple assignment - 1', () => {
  runPatchTest(
    { x: 3 },
    (d: any) => {
      d.x++;
    },
    [{ op: 'replace', path: ['x'], value: 4 }]
  );
});

describe('simple assignment - 2', () => {
  runPatchTest(
    { x: { y: 4 } },
    (d: any) => {
      d.x.y++;
    },
    [{ op: 'replace', path: ['x', 'y'], value: 5 }]
  );
});

describe('simple assignment - 3', () => {
  runPatchTest(
    { x: [{ y: 4 }] },
    (d: any) => {
      d.x[0].y++;
    },
    [{ op: 'replace', path: ['x', 0, 'y'], value: 5 }]
  );
});

describe('simple assignment - 4', () => {
  runPatchTest(
    new Map([['x', { y: 4 }]]),
    (d: any) => {
      d.get('x').y++;
    },
    [{ op: 'replace', path: ['x', 'y'], value: 5 }],
    [{ op: 'replace', path: ['x', 'y'], value: 4 }]
  );
});

describe('simple assignment - 5', () => {
  runPatchTest(
    { x: new Map([['y', 4]]) },
    (d: any) => {
      d.x.set('y', 5);
    },
    [{ op: 'replace', path: ['x', 'y'], value: 5 }],
    [{ op: 'replace', path: ['x', 'y'], value: 4 }]
  );
});

describe('simple assignment - 6', () => {
  runPatchTest(
    new Map([['x', 1]]),
    (d: any) => {
      // Map.prototype.set should return the Map itself
      const res = d.set('x', 2);
      res.set('y', 3);
    },
    [
      { op: 'replace', path: ['x'], value: 2 },
      { op: 'add', path: ['y'], value: 3 },
    ],
    [
      { op: 'replace', path: ['x'], value: 1 },
      { op: 'remove', path: ['y'] },
    ]
  );
});

describe('simple assignment - 7', () => {
  const key1 = { prop: 'val1' };
  const key2 = { prop: 'val2' };
  runPatchTest(
    { x: new Map([[key1, 4]]) },
    (d: any) => {
      d.x.set(key1, 5);
      d.x.set(key2, 6);
    },
    [
      { op: 'replace', path: ['x', key1], value: 5 },
      { op: 'add', path: ['x', key2], value: 6 },
    ],
    [
      { op: 'replace', path: ['x', key1], value: 4 },
      { op: 'remove', path: ['x', key2] },
    ]
  );
});

describe('delete 1', () => {
  runPatchTest(
    { x: { y: 4 } },
    (d: any) => {
      delete d.x;
    },
    [{ op: 'remove', path: ['x'] }]
  );
});

describe('delete 2', () => {
  runPatchTest(
    new Map([['x', 1]]),
    (d: any) => {
      d.delete('x');
    },
    [{ op: 'remove', path: ['x'] }],
    [{ op: 'add', path: ['x'], value: 1 }]
  );
});

describe('delete 3', () => {
  runPatchTest(
    { x: new Map([['y', 1]]) },
    (d: any) => {
      d.x.delete('y');
    },
    [{ op: 'remove', path: ['x', 'y'] }],
    [{ op: 'add', path: ['x', 'y'], value: 1 }]
  );
});

describe('delete 5', () => {
  const key1 = { prop: 'val1' };
  const key2 = { prop: 'val2' };
  runPatchTest(
    {
      x: new Map([
        [key1, 1],
        [key2, 2],
      ]),
    },
    (d: any) => {
      d.x.delete(key1);
      d.x.delete(key2);
    },
    [
      { op: 'remove', path: ['x', key1] },
      { op: 'remove', path: ['x', key2] },
    ],
    [
      { op: 'add', path: ['x', key1], value: 1 },
      { op: 'add', path: ['x', key2], value: 2 },
    ]
  );
});

describe('delete 6', () => {
  runPatchTest(
    new Set(['x', 1]),
    (d: any) => {
      d.delete('x');
    },
    [{ op: 'remove', path: [0], value: 'x' }],
    [{ op: 'add', path: [0], value: 'x' }]
  );
});

describe('delete 7', () => {
  runPatchTest(
    { x: new Set(['y', 1]) },
    (d: any) => {
      d.x.delete('y');
    },
    [{ op: 'remove', path: ['x', 0], value: 'y' }],
    [{ op: 'add', path: ['x', 0], value: 'y' }]
  );
});

describe('renaming properties', () => {
  describe('nested object (no changes)', () => {
    runPatchTest(
      { a: { b: 1 } },
      (d: any) => {
        d.x = d.a;
        delete d.a;
      },
      [
        { op: 'add', path: ['x'], value: { b: 1 } },
        { op: 'remove', path: ['a'] },
      ]
    );
  });

  describe('nested change in object', () => {
    runPatchTest(
      {
        a: { b: 1 },
      },
      (d: any) => {
        d.a.b++;
      },
      [{ op: 'replace', path: ['a', 'b'], value: 2 }],
      [{ op: 'replace', path: ['a', 'b'], value: 1 }]
    );
  });

  describe('nested change in map', () => {
    runPatchTest(
      new Map([['a', new Map([['b', 1]])]]),
      (d: any) => {
        d.get('a').set('b', 2);
      },
      [{ op: 'replace', path: ['a', 'b'], value: 2 }],
      [{ op: 'replace', path: ['a', 'b'], value: 1 }]
    );
  });

  describe('nested change in array', () => {
    runPatchTest(
      [[{ b: 1 }]],
      (d: any) => {
        d[0][0].b++;
      },
      [{ op: 'replace', path: [0, 0, 'b'], value: 2 }],
      [{ op: 'replace', path: [0, 0, 'b'], value: 1 }]
    );
  });

  describe('nested map (no changes)', () => {
    runPatchTest(
      new Map([['a', new Map([['b', 1]])]]),
      (d: any) => {
        d.set('x', d.get('a'));
        d.delete('a');
      },
      [
        { op: 'add', path: ['x'], value: new Map([['b', 1]]) },
        { op: 'remove', path: ['a'] },
      ],
      [
        { op: 'remove', path: ['x'] },
        { op: 'add', path: ['a'], value: new Map([['b', 1]]) },
      ]
    );
  });

  describe('nested object (with changes)', () => {
    runPatchTest(
      { a: { b: 1, c: 1 } },
      (d: any) => {
        let a = d.a;
        a.b = 2; // change
        delete a.c; // delete
        a.y = 2; // add

        // rename
        d.x = a;
        delete d.a;
      },
      [
        { op: 'add', path: ['x'], value: { b: 2, y: 2 } },
        { op: 'remove', path: ['a'] },
      ]
    );
  });

  describe('nested map (with changes)', () => {
    runPatchTest(
      new Map([
        [
          'a',
          new Map([
            ['b', 1],
            ['c', 1],
          ]),
        ],
      ]),
      (d: any) => {
        let a = d.get('a');
        a.set('b', 2); // change
        a.delete('c'); // delete
        a.set('y', 2); // add

        // rename
        d.set('x', a);
        d.delete('a');
      },
      [
        {
          op: 'add',
          path: ['x'],
          value: new Map([
            ['b', 2],
            ['y', 2],
          ]),
        },
        { op: 'remove', path: ['a'] },
      ],
      [
        { op: 'remove', path: ['x'] },
        {
          op: 'add',
          path: ['a'],
          value: new Map([
            ['b', 1],
            ['c', 1],
          ]),
        },
      ]
    );
  });

  describe('deeply nested object (with changes)', () => {
    runPatchTest(
      { a: { b: { c: 1, d: 1 } } },
      (d: any) => {
        let b = d.a.b;
        b.c = 2; // change
        delete b.d; // delete
        b.y = 2; // add

        // rename
        d.a.x = b;
        delete d.a.b;
      },
      [
        { op: 'add', path: ['a', 'x'], value: { c: 2, y: 2 } },
        { op: 'remove', path: ['a', 'b'] },
      ]
    );
  });

  describe('deeply nested map (with changes)', () => {
    runPatchTest(
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
      (d: any) => {
        let b = d.get('a').get('b');
        b.set('c', 2); // change
        b.delete('d'); // delete
        b.set('y', 2); // add

        // rename
        d.get('a').set('x', b);
        d.get('a').delete('b');
      },
      [
        {
          op: 'add',
          path: ['a', 'x'],
          value: new Map([
            ['c', 2],
            ['y', 2],
          ]),
        },
        { op: 'remove', path: ['a', 'b'] },
      ],
      [
        { op: 'remove', path: ['a', 'x'] },
        {
          op: 'add',
          path: ['a', 'b'],
          value: new Map([
            ['c', 1],
            ['d', 1],
          ]),
        },
      ]
    );
  });
});

describe('minimum amount of changes', () => {
  runPatchTest(
    { x: 3, y: { a: 4 }, z: 3 },
    (d: any) => {
      d.y.a = 4;
      d.y.b = 5;
      Object.assign(d, { x: 4, y: { a: 2 } });
    },
    [
      { op: 'replace', path: ['x'], value: 4 },
      { op: 'replace', path: ['y'], value: { a: 2 } },
    ]
  );
});

describe('arrays - prepend', () => {
  runPatchTest(
    { x: [1, 2, 3] },
    (d: any) => {
      d.x.unshift(4);
    },
    [
      { op: 'replace', path: ['x', 0], value: 4 },
      { op: 'replace', path: ['x', 1], value: 1 },
      { op: 'replace', path: ['x', 2], value: 2 },
      { op: 'add', path: ['x', 3], value: 3 },
    ]
  );
});

describe('arrays - multiple prepend', () => {
  runPatchTest(
    { x: [1, 2, 3] },
    (d: any) => {
      d.x.unshift(4);
      d.x.unshift(5);
      // 4,5,1,2,3
    },
    [
      { op: 'replace', path: ['x', 0], value: 5 },
      { op: 'replace', path: ['x', 1], value: 4 },
      { op: 'replace', path: ['x', 2], value: 1 },
      { op: 'add', path: ['x', 3], value: 2 },
      { op: 'add', path: ['x', 4], value: 3 },
    ]
  );
});

describe('arrays - splice middle', () => {
  runPatchTest(
    { x: [1, 2, 3] },
    (d: any) => {
      d.x.splice(1, 1);
    },
    [
      { op: 'replace', path: ['x', 1], value: 3 },
      { op: 'replace', path: ['x', 'length'], value: 2 },
    ]
  );
});

describe('arrays - multiple splice', () => {
  runPatchTest(
    [0, 1, 2, 3, 4, 5, 0],
    (d: any) => {
      d.splice(4, 2, 3);
      // [0,1,2,3,3,0]
      d.splice(1, 2, 3);
      // [0,3,3,3,0]
      expect(d.slice()).toEqual([0, 3, 3, 3, 0]);
    },
    [
      { op: 'replace', path: [1], value: 3 },
      { op: 'replace', path: [2], value: 3 },
      { op: 'replace', path: [4], value: 0 },
      { op: 'replace', path: ['length'], value: 5 },
    ]
  );
});

describe('arrays - modify and shrink', () => {
  runPatchTest(
    { x: [1, 2, 3] },
    (d: any) => {
      d.x[0] = 4;
      d.x.length = 2;
      // [0, 2]
    },
    [
      { op: 'replace', path: ['x', 0], value: 4 },
      { op: 'replace', path: ['x', 'length'], value: 2 },
    ],
    [
      { op: 'replace', path: ['x', 0], value: 1 },
      { op: 'add', path: ['x', 2], value: 3 },
    ]
  );
});

describe('arrays - prepend then splice middle', () => {
  runPatchTest(
    { x: [1, 2, 3] },
    (d: any) => {
      d.x.unshift(4);
      d.x.splice(2, 1);
      // 4, 1, 3
    },
    [
      { op: 'replace', path: ['x', 0], value: 4 },
      { op: 'replace', path: ['x', 1], value: 1 },
    ]
  );
});

describe('arrays - splice middle then prepend', () => {
  runPatchTest(
    { x: [1, 2, 3] },
    (d: any) => {
      d.x.splice(1, 1);
      d.x.unshift(4);
      // [4, 1, 3]
    },
    [
      { op: 'replace', path: ['x', 0], value: 4 },
      { op: 'replace', path: ['x', 1], value: 1 },
    ]
  );
});

describe('arrays - truncate', () => {
  runPatchTest(
    { x: [1, 2, 3] },
    (d: any) => {
      d.x.length -= 2;
    },
    [{ op: 'replace', path: ['x', 'length'], value: 1 }],
    [
      { op: 'add', path: ['x', 1], value: 2 },
      { op: 'add', path: ['x', 2], value: 3 },
    ]
  );
});

describe('arrays - pop twice', () => {
  runPatchTest(
    { x: [1, 2, 3] },
    (d: any) => {
      d.x.pop();
      d.x.pop();
    },
    [{ op: 'replace', path: ['x', 'length'], value: 1 }]
  );
});

describe('arrays - push multiple', () => {
  // These patches were more optimal pre immer 7, but not always correct
  runPatchTest(
    { x: [1, 2, 3] },
    (d: any) => {
      d.x.push(4, 5);
    },
    [
      { op: 'add', path: ['x', 3], value: 4 },
      { op: 'add', path: ['x', 4], value: 5 },
    ],
    [{ op: 'replace', path: ['x', 'length'], value: 3 }]
  );
});

describe('arrays - splice (expand)', () => {
  // These patches were more optimal pre immer 7, but not always correct
  runPatchTest(
    { x: [1, 2, 3] },
    (d: any) => {
      d.x.splice(1, 1, 4, 5, 6); // [1,4,5,6,3]
    },
    [
      { op: 'replace', path: ['x', 1], value: 4 },
      { op: 'replace', path: ['x', 2], value: 5 },
      { op: 'add', path: ['x', 3], value: 6 },
      { op: 'add', path: ['x', 4], value: 3 },
    ],
    [
      { op: 'replace', path: ['x', 1], value: 2 },
      { op: 'replace', path: ['x', 2], value: 3 },
      { op: 'replace', path: ['x', 'length'], value: 3 },
    ]
  );
});

describe('arrays - splice (shrink)', () => {
  // These patches were more optimal pre immer 7, but not always correct
  runPatchTest(
    { x: [1, 2, 3, 4, 5] },
    (d: any) => {
      d.x.splice(1, 3, 6); // [1, 6, 5]
    },
    [
      { op: 'replace', path: ['x', 1], value: 6 },
      { op: 'replace', path: ['x', 2], value: 5 },
      { op: 'replace', path: ['x', 'length'], value: 3 },
    ],
    [
      { op: 'replace', path: ['x', 1], value: 2 },
      { op: 'replace', path: ['x', 2], value: 3 },
      { op: 'add', path: ['x', 3], value: 4 },
      { op: 'add', path: ['x', 4], value: 5 },
    ]
  );
});

describe('arrays - delete', () => {
  runPatchTest(
    {
      x: [
        { a: 1, b: 2 },
        { c: 3, d: 4 },
      ],
    },
    (d: any) => {
      delete d.x[1].c;
    },
    [{ op: 'remove', path: ['x', 1, 'c'] }]
  );
});

describe('arrays - append', () => {
  test("appends to array when last part of path is '-'", () => {
    const state = {
      list: [1, 2, 3],
    };
    const patch = {
      op: 'add',
      value: 4,
      path: ['list', '-'],
    };
    // @ts-ignore
    expect(apply(state, [patch])).toEqual({
      list: [1, 2, 3, 4],
    });
  });
});

describe('sets - add - 1', () => {
  runPatchTest(
    new Set([1]),
    (d: any) => {
      d.add(2);
    },
    [{ op: 'add', path: [1], value: 2 }],
    [{ op: 'remove', path: [1], value: 2 }]
  );
});

describe('sets - add, delete, add - 1', () => {
  runPatchTest(
    new Set([1]),
    (d: any) => {
      d.add(2);
      d.delete(2);
      d.add(2);
    },
    [{ op: 'add', path: [1], value: 2 }],
    [{ op: 'remove', path: [1], value: 2 }]
  );
});

describe('sets - add, delete, add - 2', () => {
  runPatchTest(
    new Set([2, 1]),
    (d: any) => {
      d.add(2);
      d.delete(2);
      d.add(2);
    },
    [],
    []
  );
});

describe('sets - mutate - 1', () => {
  const findById = (set: any, id: any) => {
    for (const item of set) {
      if (item.id === id) return item;
    }
  };
  runPatchTest(
    new Set([
      { id: 1, val: 'We' },
      { id: 2, val: 'will' },
    ]),
    (d: any) => {
      const obj1 = findById(d, 1);
      const obj2 = findById(d, 2);
      obj1.val = 'rock';
      obj2.val = 'you';
    },
    [
      { op: 'replace', path: [1, 'val'], value: 'you' },
      { op: 'replace', path: [0, 'val'], value: 'rock' },
      // { op: 'remove', path: [0], value: { id: 1, val: 'We' } },
      // { op: 'remove', path: [1], value: { id: 2, val: 'will' } },
      // { op: 'add', path: [0], value: { id: 1, val: 'rock' } },
      // { op: 'add', path: [1], value: { id: 2, val: 'you' } },
    ],
    [
      { op: 'replace', path: [1, 'val'], value: 'will' },
      { op: 'replace', path: [0, 'val'], value: 'We' },
      // { op: 'replace', path: [0, 'val'], value: 'We' },
      // { op: 'remove', path: [1], value: { id: 2, val: 'you' } },
      // { op: 'remove', path: [0], value: { id: 1, val: 'rock' } },
      // { op: 'add', path: [1], value: { id: 2, val: 'will' } },
      // { op: 'add', path: [0], value: { id: 1, val: 'We' } },
    ]
  );
});

describe('arrays - splice should should result in remove op.', () => {
  // These patches were more optimal pre immer 7, but not always correct
  runPatchTest(
    [1, 2],
    (d: any) => {
      d.splice(1, 1);
    },
    [{ op: 'replace', path: ['length'], value: 1 }],
    [{ op: 'add', path: [1], value: 2 }]
  );
});

describe('arrays - NESTED splice should should result in remove op.', () => {
  // These patches were more optimal pre immer 7, but not always correct
  runPatchTest(
    { a: { b: { c: [1, 2] } } },
    (d: any) => {
      d.a.b.c.splice(1, 1);
    },
    [{ op: 'replace', path: ['a', 'b', 'c', 'length'], value: 1 }],
    [{ op: 'add', path: ['a', 'b', 'c', 1], value: 2 }]
  );
});

// describe('simple replacement', () => {
//   runPatchTest({ x: 3 }, (_d: any) => 4, [{ op: 'replace', path: [], value: 4 }]);
// });

describe('same value replacement - 1', () => {
  runPatchTest(
    { x: { y: 3 } },
    (d: any) => {
      const a = d.x;
      d.x = a;
    },
    []
  );
});

describe('same value replacement - 2', () => {
  runPatchTest(
    { x: { y: 3 } },
    (d: any) => {
      const a = d.x;
      d.x = 4;
      d.x = a;
    },
    []
  );
});

describe('same value replacement - 3', () => {
  runPatchTest(
    { x: 3 },
    (d: any) => {
      d.x = 3;
    },
    []
  );
});

describe('same value replacement - 4', () => {
  runPatchTest(
    { x: 3 },
    (d: any) => {
      d.x = 4;
      d.x = 3;
    },
    []
  );
});

describe('same value replacement - 5', () => {
  runPatchTest(
    new Map([['x', 3]]),
    (d: any) => {
      d.set('x', 4);
      d.set('x', 3);
    },
    [],
    []
  );
});

describe('same value replacement - 6', () => {
  runPatchTest(
    new Set(['x', 3]),
    (d: any) => {
      d.delete('x');
      d.add('x');
    },
    [],
    []
  );
});

describe('simple delete', () => {
  runPatchTest(
    { x: 2 },
    (d: any) => {
      delete d.x;
    },
    [
      {
        op: 'remove',
        path: ['x'],
      },
    ]
  );
});

describe('patch compressions yields correct results', () => {
  let p1: any, p2: any;
  runPatchTest(
    {},
    (d: any) => {
      d.x = { test: true };
    },
    (p1 = [
      {
        op: 'add',
        path: ['x'],
        value: {
          test: true,
        },
      },
    ])
  );
  runPatchTest(
    { x: { test: true } },
    (d: any) => {
      delete d.x;
    },
    (p2 = [
      {
        op: 'remove',
        path: ['x'],
      },
    ])
  );
  const res = runPatchTest(
    {},
    (d: any) => {
      apply(d, [...p1, ...p2]);
    },
    []
  );

  expect(res).toEqual({});
});

describe('change then delete property', () => {
  const res = runPatchTest(
    {
      x: 1,
    },
    (d: any) => {
      d.x = 2;
      delete d.x;
    },
    [
      {
        op: 'remove',
        path: ['x'],
      },
    ]
  );
  test('valid result', () => {
    expect(res).toEqual({});
  });
});

test('replaying patches with interweaved replacements should work correctly', () => {
  const patches: any = [];
  const s0 = { y: { x: 1 } };

  const [s1, p1] = create(
    s0,
    (draft) => {
      draft.y.x = 2;
    },
    {
      enablePatches: true,
    }
  );

  patches.push(...p1);

  const [s2, p2] = create(
    s1,
    (draft) => {
      draft.y = { x: 0 };
    },
    {
      enablePatches: true,
    }
  );
  patches.push(...p2);

  const [s3, p3] = create(
    s2,
    (draft) => {
      draft.y.x--;
    },
    {
      enablePatches: true,
    }
  );
  patches.push(...p3);

  expect(s3).toEqual({ y: { x: -1 } }); // correct result
  expect(apply(s0, patches)).toEqual({ y: { x: -1 } }); // correct replay

  // manual replay on a draft should also be correct
  expect(
    create(s0, (draft) => {
      apply(draft, patches);
    })
  ).toEqual({ y: { x: -1 } });
});

describe('#468', () => {
  function run() {
    const item = { id: 1 };
    const state = [item];
    const [nextState, patches] = create(
      state,
      (draft) => {
        draft[0].id = 2;
        draft[1] = item;
      },
      {
        enablePatches: true,
      }
    );

    expect(nextState).toEqual([{ id: 2 }, { id: 1 }]);
    expect(patches).toEqual([
      {
        op: 'replace',
        path: [0, 'id'],
        value: 2,
      },
      {
        op: 'add',
        path: [1],
        value: {
          id: 1,
        },
      },
    ]);

    const final = apply(state, patches);
    expect(final).toEqual(nextState);
  }

  // test('es5', () => {
  //   setUseProxies(false);
  //   run();
  // });

  test('proxy', () => {
    // setUseProxies(true);
    run();
  });
});

test('#521', () => {
  const state = new Map();

  const [nextState, patches] = create(
    state,
    (draft) => {
      draft.set('hello', new Set(['world']));
    },
    {
      enablePatches: true,
    }
  );

  let patchedState = apply(state, patches);
  expect(patchedState).toEqual(nextState);

  const [nextStateV2, patchesV2] = create(
    nextState,
    (draft) => {
      draft.get('hello').add('immer');
    },
    {
      enablePatches: true,
    }
  );

  expect(apply(nextState, patchesV2)).toEqual(
    new Map([['hello', new Set(['world', 'immer'])]])
  );
});

test('#559 patches works in a nested reducer with proxies', () => {
  const state = {
    x: 1,
    sub: {
      y: [{ a: 0 }, { a: 1 }],
    },
  };

  const changes: any[] = [];
  const inverseChanges: any[] = [];

  const newState = create(state, (draft) => {
    const [newSub, patches, inversePatches] = create(
      draft.sub,
      (draft) => {
        draft.y.pop();
      },
      {
        enablePatches: true,
      }
    );
    draft.sub = newSub;

    expect(isDraft(inversePatches[0].value)).toBeFalsy();
    expect(inversePatches[0].value).toMatchObject({ a: 1 });
    changes.push(...patches);
    inverseChanges.push(...inversePatches);
  });

  const reversedSubState = apply(newState.sub, inverseChanges);

  expect(reversedSubState).toMatchObject(state.sub);
});

// describe('#588', () => {
//   const reference = { value: { num: 53 } };

//   class Base {
//     get nested() {
//       return reference.value;
//     }
//     set nested(value) {}
//   }

//   let base = new Base();

//   runPatchTest(
//     base,
//     (vdraft: any) => {
//       reference.value = vdraft;
//       create(
//         base,
//         (bdraft) => {
//           bdraft.nested.num = 42;
//         },
//         {
//           mark: (target, { immutable }) => {
//             if (target instanceof Base) {
//               return immutable;
//             }
//           },
//         }
//       );
//     },
//     [{ op: 'add', path: ['num'], value: 42 }]
//   );
// });

test('#676 patching Date objects', () => {
  class Test {
    constructor() {
      // @ts-ignore
      this.test = true;
    }
    perform() {
      return 'tested!';
    }
  }

  const [nextState, patches] = create(
    {},
    function (draft) {
      // @ts-ignore
      draft.date = new Date('2020-11-10T08:08:08.003Z');
      // @ts-ignore
      draft.test = new Test();
    },
    {
      enablePatches: true,
    }
  );

  // @ts-ignore
  expect(nextState.date.toJSON()).toMatchInlineSnapshot(
    `"2020-11-10T08:08:08.003Z"`
  );
  // @ts-ignore
  expect(nextState.test.perform()).toBe('tested!');

  const rebuilt = apply({}, patches);
  // @ts-ignore
  expect(rebuilt.date).toBeInstanceOf(Date);
  // @ts-ignore
  expect(rebuilt.date.toJSON()).toMatchInlineSnapshot(
    `"2020-11-10T08:08:08.003Z"`
  );
  // @ts-ignore
  expect(rebuilt.date).toEqual(new Date('2020-11-10T08:08:08.003Z'));
});

test('do not allow __proto__ polution - 738', () => {
  const obj = {};

  // @ts-ignore
  expect(obj.polluted).toBe(undefined);
  expect(() => {
    apply({}, [{ op: 'add', path: ['__proto__', 'polluted'], value: 'yes' }]);
  }).toThrow(
    isProd
      ? '24'
      : 'Patching reserved attributes like __proto__ and constructor is not allowed'
  );
  // @ts-ignore
  expect(obj.polluted).toBe(undefined);
});

test('do not allow __proto__ polution using arrays - 738', () => {
  const obj: any = {};
  const ar: any[] = [];

  // @ts-ignore
  expect(obj.polluted).toBe(undefined);
  // @ts-ignore
  expect(ar.polluted).toBe(undefined);
  expect(() => {
    apply([], [{ op: 'add', path: ['__proto__', 'polluted'], value: 'yes' }]);
  }).toThrow(
    isProd
      ? '24'
      : 'Patching reserved attributes like __proto__ and constructor is not allowed'
  );
  // @ts-ignore
  expect(obj.polluted).toBe(undefined);
  // @ts-ignore
  expect(ar.polluted).toBe(undefined);
});

test('do not allow prototype polution - 738', () => {
  const obj = {};

  // @ts-ignore
  expect(obj.polluted).toBe(undefined);
  expect(() => {
    apply(Object, [
      { op: 'add', path: ['prototype', 'polluted'], value: 'yes' },
    ]);
  }).toThrowErrorMatchingInlineSnapshot(
    `"Patching reserved attributes like __proto__ and constructor is not allowed."`
  );
  // @ts-ignore
  expect(obj.polluted).toBe(undefined);
});

test('do not allow constructor polution - 738', () => {
  const obj = {};

  // @ts-ignore
  expect(obj.polluted).toBe(undefined);
  const t = {};
  apply(t, [{ op: 'replace', path: ['constructor'], value: 'yes' }]);
  expect(typeof t.constructor).toBe('function');
  // @ts-ignore
  expect(Object.polluted).toBe(undefined);
});

test('do not allow constructor.prototype polution - 738', () => {
  const obj = {};

  // @ts-ignore
  expect(obj.polluted).toBe(undefined);
  expect(() => {
    apply({}, [
      {
        op: 'add',
        path: ['constructor', 'prototype', 'polluted'],
        value: 'yes',
      },
    ]);
  }).toThrow(
    isProd
      ? '24'
      : 'Patching reserved attributes like __proto__ and constructor is not allowed'
  );
  // @ts-ignore
  expect(Object.polluted).toBe(undefined);
});

test('maps can store __proto__, prototype and constructor props', () => {
  const obj = {};
  const map = new Map();
  map.set('__proto__', {});
  map.set('constructor', {});
  map.set('prototype', {});
  const newMap = apply(map, [
    { op: 'add', path: ['__proto__', 'polluted'], value: 'yes' },
    { op: 'add', path: ['constructor', 'polluted'], value: 'yes' },
    { op: 'add', path: ['prototype', 'polluted'], value: 'yes' },
  ]);
  expect(newMap.get('__proto__').polluted).toBe('yes');
  expect(newMap.get('constructor').polluted).toBe('yes');
  expect(newMap.get('prototype').polluted).toBe('yes');
  // @ts-ignore
  expect(obj.polluted).toBe(undefined);
});

test('CVE-2020-28477 (https://snyk.io/vuln/SNYK-JS-IMMER-1019369) follow up', () => {
  const obj = {};

  // @ts-ignore
  expect(obj.polluted).toBe(undefined);
  expect(() => {
    // @ts-ignore
    apply({}, [{ op: 'add', path: [['__proto__'], 'polluted'], value: 'yes' }]);
  }).toThrow(
    isProd
      ? '24'
      : 'Patching reserved attributes like __proto__ and constructor is not allowed'
  );
  // @ts-ignore
  expect(obj.polluted).toBe(undefined);
});

test('#648 assigning object to itself should not change patches', () => {
  const input = {
    obj: {
      value: 200,
    },
  };

  const [nextState, patches] = create(
    input,
    (draft) => {
      draft.obj.value = 1;
      draft.obj = draft.obj;
    },
    {
      enablePatches: true,
    }
  );

  expect(patches).toEqual([
    {
      op: 'replace',
      path: ['obj', 'value'],
      value: 1,
    },
  ]);
});

// test('#791 patch for returning `undefined` is stored as undefined', () => {
//   const [newState, patches] = create({ abc: 123 }, (draft) => safeReturn(undefined), {
//     enablePatches: true,
//   });
//   expect(patches).toEqual([{ op: 'replace', path: [], value: undefined }]);

//   expect(apply({}, patches)).toEqual(undefined);
// });

test('#876 Ensure empty patch set for atomic set+delete on Map', () => {
  {
    const [newState, patches] = create(
      new Map([['foo', 'baz']]),
      (draft) => {
        draft.set('foo', 'bar');
        draft.delete('foo');
      },
      {
        enablePatches: true,
      }
    );
    expect(patches).toEqual([{ op: 'remove', path: ['foo'] }]);
  }

  {
    const [newState, patches] = create(
      new Map(),
      (draft) => {
        draft.set('foo', 'bar');
        draft.delete('foo');
      },
      {
        enablePatches: true,
      }
    );
    expect(patches).toEqual([]);
  }
});

test('#888 patch to a primitive produces the primitive', () => {
  {
    const [res, patches] = create(
      { abc: 123 },
      (draft) => safeReturn(undefined),
      {
        enablePatches: true,
      }
    );
    expect(res).toEqual(undefined);
    expect(patches).toEqual([{ op: 'replace', path: [], value: undefined }]);
  }
  {
    const [res, patches] = create(null, (draft) => safeReturn(undefined), {
      enablePatches: true,
    });
    expect(res).toEqual(undefined);
    expect(patches).toEqual([{ op: 'replace', path: [], value: undefined }]);
  }
  {
    const [res, patches] = create(0, (draft) => safeReturn(undefined), {
      enablePatches: true,
    });
    expect(res).toEqual(undefined);
    expect(patches).toEqual([{ op: 'replace', path: [], value: undefined }]);
  }
  {
    const [res, patches] = create('foobar', (draft) => safeReturn(undefined), {
      enablePatches: true,
    });
    expect(res).toEqual(undefined);
    expect(patches).toEqual([{ op: 'replace', path: [], value: undefined }]);
  }
  {
    const [res, patches] = create([], (draft) => safeReturn(undefined), {
      enablePatches: true,
    });
    expect(res).toEqual(undefined);
    expect(patches).toEqual([{ op: 'replace', path: [], value: undefined }]);
  }
  {
    const [res, patches] = create(false, (draft) => safeReturn(undefined), {
      enablePatches: true,
    });
    expect(res).toEqual(undefined);
    expect(patches).toEqual([{ op: 'replace', path: [], value: undefined }]);
  }
  {
    const [res, patches] = create('foobar', (draft) => 'something else', {
      enablePatches: true,
    });
    expect(res).toEqual('something else');
    expect(patches).toEqual([
      { op: 'replace', path: [], value: 'something else' },
    ]);
  }
  {
    const [res, patches] = create(false, (draft) => true, {
      enablePatches: true,
    });
    expect(res).toEqual(true);
    expect(patches).toEqual([{ op: 'replace', path: [], value: true }]);
  }
});

describe('#879 delete item from array', () => {
  runPatchTest(
    [1, 2, 3],
    (draft: any) => {
      delete draft[1];
    },
    [{ op: 'replace', path: [1], value: undefined }],
    [{ op: 'replace', path: [1], value: 2 }],
    [1, undefined, 3]
  );
});

describe('#879 delete item from array - 2', () => {
  runPatchTest(
    [1, 2, 3],
    (draft: any) => {
      delete draft[2];
    },
    [{ op: 'replace', path: [2], value: undefined }],
    [{ op: 'replace', path: [2], value: 3 }],
    [1, 2, undefined]
  );
});

test('#897 appendPatch', () => {
  const state0 = { a: [] };
  const state1 = apply(state0, [{ op: 'add', path: ['a', '-'], value: 1 }]);
  const state2 = apply(state1, [{ op: 'add', path: ['a', '-'], value: 2 }]);
  const state3 = apply(state2, [{ op: 'add', path: ['a', '-'], value: 3 }]);
  expect(state3).toEqual({
    a: [1, 2, 3],
  });
});
