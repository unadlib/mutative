/* eslint-disable no-param-reassign */
import { compare } from 'fast-json-patch';
import { apply, create } from '../src';

test('base apply with string path', () => {
  const stateA = { '/a': { '/~1a/~1b': [1, 2, 3] } };
  const stateB = { '/a': { '/~1a/~1b': [3, 2, 1] } };
  expect(apply(stateA, compare(stateA, stateB) as any)).toEqual(stateB);
});

test('patches should not contain `array.length` - arrayLengthAssignment: false, pathAsArray: true', () => {
  const data = { list: [1, 2, 3] };
  const [state, patches, inversePatches] = create(
    data,
    (draft) => {
      draft.list.length = 0;
    },
    {
      enablePatches: {
        pathAsArray: true,
        arrayLengthAssignment: false,
      },
    }
  );
  expect(Array.isArray(patches[0].path)).toBeTruthy();
  expect(Array.isArray(inversePatches[0].path)).toBeTruthy();
  const prevState = apply(state, inversePatches);
  expect(prevState).toEqual(data);
  const nextState = apply(data, patches);
  expect(nextState).toEqual(state);
  expect(state).toMatchInlineSnapshot(`
    {
      "list": [],
    }
  `);
  expect(patches).toMatchInlineSnapshot(`
    [
      {
        "op": "replace",
        "path": [
          "list",
          0,
        ],
        "value": undefined,
      },
      {
        "op": "replace",
        "path": [
          "list",
          1,
        ],
        "value": undefined,
      },
      {
        "op": "replace",
        "path": [
          "list",
          2,
        ],
        "value": undefined,
      },
    ]
  `);
  expect(inversePatches).toMatchInlineSnapshot(`
    [
      {
        "op": "replace",
        "path": [
          "list",
          0,
        ],
        "value": 1,
      },
      {
        "op": "replace",
        "path": [
          "list",
          1,
        ],
        "value": 2,
      },
      {
        "op": "replace",
        "path": [
          "list",
          2,
        ],
        "value": 3,
      },
    ]
  `);
});

test('patches should contain `array.length` - arrayLengthAssignment: true, pathAsArray: true', () => {
  const data = { list: [1, 2, 3] };
  const [state, patches, inversePatches] = create(
    data,
    (draft) => {
      draft.list.length = 0;
    },
    {
      enablePatches: {
        pathAsArray: true,
        arrayLengthAssignment: true,
      },
    }
  );
  expect(Array.isArray(patches[0].path)).toBeTruthy();
  expect(Array.isArray(inversePatches[0].path)).toBeTruthy();
  const prevState = apply(state, inversePatches);
  expect(prevState).toEqual(data);
  const nextState = apply(data, patches);
  expect(nextState).toEqual(state);
  expect(state).toMatchInlineSnapshot(`
    {
      "list": [],
    }
  `);
  expect(patches).toMatchInlineSnapshot(`
    [
      {
        "op": "replace",
        "path": [
          "list",
          0,
        ],
        "value": undefined,
      },
      {
        "op": "replace",
        "path": [
          "list",
          1,
        ],
        "value": undefined,
      },
      {
        "op": "replace",
        "path": [
          "list",
          2,
        ],
        "value": undefined,
      },
    ]
  `);
  expect(inversePatches).toMatchInlineSnapshot(`
    [
      {
        "op": "replace",
        "path": [
          "list",
          0,
        ],
        "value": 1,
      },
      {
        "op": "replace",
        "path": [
          "list",
          1,
        ],
        "value": 2,
      },
      {
        "op": "replace",
        "path": [
          "list",
          2,
        ],
        "value": 3,
      },
    ]
  `);
});

test('patches should contain `array.length` - arrayLengthAssignment: true, pathAsArray: false', () => {
  const data = { list: [1, 2, 3] };
  const [state, patches, inversePatches] = create(
    data,
    (draft) => {
      draft.list.length = 0;
    },
    {
      enablePatches: {
        pathAsArray: false,
        arrayLengthAssignment: true,
      },
    }
  );
  expect(typeof patches[0].path === 'string').toBeTruthy();
  expect(typeof inversePatches[0].path === 'string').toBeTruthy();
  const prevState = apply(state, inversePatches);
  expect(prevState).toEqual(data);
  const nextState = apply(data, patches);
  expect(nextState).toEqual(state);
  expect(state).toMatchInlineSnapshot(`
    {
      "list": [],
    }
  `);
  expect(patches).toMatchInlineSnapshot(`
    [
      {
        "op": "replace",
        "path": "/list/0",
        "value": undefined,
      },
      {
        "op": "replace",
        "path": "/list/1",
        "value": undefined,
      },
      {
        "op": "replace",
        "path": "/list/2",
        "value": undefined,
      },
    ]
  `);
  expect(inversePatches).toMatchInlineSnapshot(`
    [
      {
        "op": "replace",
        "path": "/list/0",
        "value": 1,
      },
      {
        "op": "replace",
        "path": "/list/1",
        "value": 2,
      },
      {
        "op": "replace",
        "path": "/list/2",
        "value": 3,
      },
    ]
  `);
});

test('patches should not contain `array.length` - arrayLengthAssignment: false, pathAsArray: false', () => {
  const data = { list: [1, 2, 3] };
  const [state, patches, inversePatches] = create(
    data,
    (draft) => {
      draft.list.length = 0;
    },
    {
      enablePatches: {
        pathAsArray: false,
        arrayLengthAssignment: true,
      },
    }
  );
  expect(typeof patches[0].path === 'string').toBeTruthy();
  expect(typeof inversePatches[0].path === 'string').toBeTruthy();
  const prevState = apply(state, inversePatches);
  expect(prevState).toEqual(data);
  const nextState = apply(data, patches);
  expect(nextState).toEqual(state);
  expect(state).toMatchInlineSnapshot(`
    {
      "list": [],
    }
  `);
  expect(patches).toMatchInlineSnapshot(`
    [
      {
        "op": "replace",
        "path": "/list/0",
        "value": undefined,
      },
      {
        "op": "replace",
        "path": "/list/1",
        "value": undefined,
      },
      {
        "op": "replace",
        "path": "/list/2",
        "value": undefined,
      },
    ]
  `);
  expect(inversePatches).toMatchInlineSnapshot(`
    [
      {
        "op": "replace",
        "path": "/list/0",
        "value": 1,
      },
      {
        "op": "replace",
        "path": "/list/1",
        "value": 2,
      },
      {
        "op": "replace",
        "path": "/list/2",
        "value": 3,
      },
    ]
  `);
});

test('edge key - apply with string path', () => {
  const data = { '/a': { '/~1a/~1b': [1, 2, 3] } };
  const [state, patches, inversePatches] = create(
    data,
    (draft) => {
      draft['/a']['/~1a/~1b'].push(4);
    },
    {
      enablePatches: {
        pathAsArray: false,
        arrayLengthAssignment: false,
      },
    }
  );
  expect(state).toMatchInlineSnapshot(`
    {
      "/a": {
        "/~1a/~1b": [
          1,
          2,
          3,
          4,
        ],
      },
    }
  `);
  expect(patches).toMatchInlineSnapshot(`
    [
      {
        "op": "add",
        "path": "/~1a/~1~01a~1~01b/3",
        "value": 4,
      },
    ]
  `);
  expect(inversePatches).toMatchInlineSnapshot(`
    [
      {
        "op": "remove",
        "path": "/~1a/~1~01a~1~01b/3",
      },
    ]
  `);

  const prevState = apply(state, inversePatches);
  expect(prevState).toEqual(data);
  const nextState = apply(data, patches);
  expect(nextState).toEqual(state);
});

describe('length change tracking', () => {
  function test_<T extends object>(source: T, f: (draft: T) => void) {
    const [actual, patches, inversePatches] = create(source, f, {
      enablePatches: {
        pathAsArray: true,
        arrayLengthAssignment: false,
      },
    });

    const expected = structuredClone(source);
    f(expected);
    expect(actual).toEqual(expected);

    expect(Array.isArray(patches[0].path)).toBeTruthy();
    expect(Array.isArray(inversePatches[0].path)).toBeTruthy();
    const prevState = apply(actual, inversePatches);
    expect(prevState).toEqual(source);
    const nextState = apply(source, patches);
    expect(nextState).toEqual(actual);
  }

  const data = { list: [1, 2, 3] };

  // test('splice(0, 0)', () => {
  //   test_((draft) => {
  //     draft.list.splice(0, 0);
  //   });
  // });

  test('splice(0, 1)', () => {
    test_(data, (draft) => {
      draft.list.splice(0, 1);
    });
  });

  test('splice(0, 1)', () => {
    test_(data, (draft) => {
      draft.list[0] = 10;
      draft.list[1] = 20;
      draft.list[2] = 30;
      draft.list.splice(0, 1);
    });
  });

  test('splice(0, 1)', () => {
    test_(data, (draft) => {
      draft.list[0] = 10;
      draft.list.splice(0, 1);
      draft.list[0] = 100;
    });
  });

  test('splice(0, 2)', () => {
    test_(data, (draft) => {
      draft.list.splice(0, 2);
    });
  });

  test('splice(0, 2)', () => {
    test_(data, (draft) => {
      draft.list[0] = 10;
      draft.list[1] = 20;
      draft.list.splice(0, 2);
    });
  });

  test('splice(0, 1, 10)', () => {
    test_(data, (draft) => {
      draft.list.splice(0, 1, 10);
    });
  });

  test('splice(0, 2, 10)', () => {
    test_(data, (draft) => {
      draft.list.splice(0, 2, 10);
    });
  });

  test('splice(0, 0, 0)', () => {
    test_(data, (draft) => {
      draft.list.splice(0, 0, 0);
    });
  });

  test('splice(1, 0, 1.5)', () => {
    test_(data, (draft) => {
      draft.list.splice(1, 0, 1.5);
    });

    test_(data, (draft) => {
      draft.list.splice(2, 0, 2.5);
    });
  });

  test('splice(0, 1, 0, 1)', () => {
    test_(data, (draft) => {
      draft.list.splice(0, 1, 0, 1);
    });
  });

  test('push', () => {
    test_(data, (draft) => {
      draft.list.push(4);
    });

    test_(data, (draft) => {
      draft.list.push(4, 5, 6);
    });
  });

  test('pop', () => {
    test_(data, (draft) => {
      draft.list.pop();
    });
  });

  test('unshift()', () => {
    test_(data, (draft) => {
      draft.list.unshift(0);
    });

    test_(data, (draft) => {
      draft.list.unshift(-2, -1, 0);
    });
  });

  test('shift()', () => {
    test_(data, (draft) => {
      draft.list.shift();
    });
  });

  test('arr[3] = 4', () => {
    test_(data, (draft) => {
      draft.list[3] = 4;
    });
  });

  test('splice(1, 3, 1)', () => {
    // 意味のない削除（削除対象がlengthを超えている）
    test_(data, (draft) => {
      draft.list.splice(3, 4, 4);
    });
  });

  describe('object array', () => {
    test('splice(0, 1)', () => {
      test_({ list: [{ id: 1 }, { id: 2 }, { id: 3 }] }, (draft) => {
        draft.list.splice(0, 1);
      });
    });

    test('splice(1, 1)', () => {
      test_({ list: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }] }, (draft) => {
        draft.list.splice(1, 1);
      });
    });
  });

  test('arr', () => {
    test_(
      {
        arr1: [{ bar: 'str1' }, { bar: 'str1' }],
        arr2: [{ bar: 'str1' }, { bar: 'str1' }],
      },
      (draft) => {
        draft.arr2.push(draft.arr1[0]);
        draft.arr2[2].bar = 'new str111';
        draft.arr2.splice(1, 4);
      }
    );
  });

  test('move', () => {
    test_([0, 1, 2, 3], (draft) => {
      const moved = draft[1];
      draft.splice(1, 1);
      draft.splice(2, 0, moved);
    });

    test_([0, 1, 2, 3], (draft) => {
      const moved = draft[1];
      draft.splice(3, 0, moved);
      draft.splice(1, 1);
    });
  });
});
