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

    const prevState = apply(actual, inversePatches);
    expect(prevState).toEqual(source);
    const nextState = apply(source, patches);
    expect(nextState).toEqual(actual);

    const expected = structuredClone(source);
    f(expected);
    expect(nextState).toEqual(expected);

    return [patches, inversePatches] as const;
  }

  const data: { list: Array<number> } = { list: [] };

  for (let i = 0; i < 100; i++) {
    data.list.push(i);
  }

  test('splice(0, 0)', () => {
    const [forward, backward] = test_(data, (draft) => {
      draft.list.splice(0, 0);
    });

    expect(forward).toMatchInlineSnapshot(`[]`);
    expect(backward).toMatchInlineSnapshot(`[]`);
  });

  test('splice(0, 1)', () => {
    const [forward, backward] = test_(data, (draft) => {
      draft.list.splice(0, 1);
    });

    expect(forward).toMatchInlineSnapshot(`
      [
        {
          "op": "remove",
          "path": [
            "list",
            0,
          ],
        },
      ]
    `);

    expect(backward).toMatchInlineSnapshot(`
      [
        {
          "op": "add",
          "path": [
            "list",
            0,
          ],
          "value": 0,
        },
      ]
    `);
  });

  test('splice(0, 1)', () => {
    const [forward, backward] = test_(data, (draft) => {
      draft.list[0] = 10;
      draft.list[1] = 20;
      draft.list[2] = 30;
      draft.list.splice(0, 1);
    });

    expect(forward).toMatchInlineSnapshot(`
      [
        {
          "op": "remove",
          "path": [
            "list",
            0,
          ],
        },
        {
          "op": "replace",
          "path": [
            "list",
            0,
          ],
          "value": 20,
        },
        {
          "op": "replace",
          "path": [
            "list",
            1,
          ],
          "value": 30,
        },
      ]
    `);
    expect(backward).toMatchInlineSnapshot(`
      [
        {
          "op": "add",
          "path": [
            "list",
            0,
          ],
          "value": 0,
        },
        {
          "op": "replace",
          "path": [
            "list",
            1,
          ],
          "value": 1,
        },
        {
          "op": "replace",
          "path": [
            "list",
            2,
          ],
          "value": 2,
        },
      ]
    `);
  });

  test('splice(0, 1)', () => {
    const [forward, backward] = test_(data, (draft) => {
      draft.list[0] = 10;
      draft.list.splice(0, 1);
      draft.list[0] = 100;
    });

    expect(forward).toMatchInlineSnapshot(`
      [
        {
          "op": "remove",
          "path": [
            "list",
            0,
          ],
        },
        {
          "op": "replace",
          "path": [
            "list",
            0,
          ],
          "value": 100,
        },
      ]
    `);
    expect(backward).toMatchInlineSnapshot(`
      [
        {
          "op": "add",
          "path": [
            "list",
            0,
          ],
          "value": 0,
        },
        {
          "op": "replace",
          "path": [
            "list",
            1,
          ],
          "value": 1,
        },
      ]
    `);
  });

  test('splice(0, 2)', () => {
    const [forward, backward] = test_(data, (draft) => {
      draft.list.splice(0, 2);
    });

    expect(forward).toMatchInlineSnapshot(`
      [
        {
          "op": "remove",
          "path": [
            "list",
            0,
          ],
        },
        {
          "op": "remove",
          "path": [
            "list",
            0,
          ],
        },
      ]
    `);
    expect(backward).toMatchInlineSnapshot(`
      [
        {
          "op": "add",
          "path": [
            "list",
            0,
          ],
          "value": 0,
        },
        {
          "op": "add",
          "path": [
            "list",
            1,
          ],
          "value": 1,
        },
      ]
    `);
  });

  test('remove added elements', () => {
    const [forward, backward] = test_(data, (draft) => {
      draft.list[0] = 10;
      draft.list[1] = 20;
      draft.list.splice(0, 2);
    });

    expect(forward).toMatchInlineSnapshot(`
      [
        {
          "op": "remove",
          "path": [
            "list",
            0,
          ],
        },
        {
          "op": "remove",
          "path": [
            "list",
            0,
          ],
        },
      ]
    `);
    expect(backward).toMatchInlineSnapshot(`
      [
        {
          "op": "add",
          "path": [
            "list",
            0,
          ],
          "value": 0,
        },
        {
          "op": "add",
          "path": [
            "list",
            1,
          ],
          "value": 1,
        },
      ]
    `);
  });

  test('remove and add at the same time', () => {
    const [forward, backward] = test_(data, (draft) => {
      draft.list.splice(0, 1, 10);
    });

    expect(forward).toMatchInlineSnapshot(`
      [
        {
          "op": "replace",
          "path": [
            "list",
            0,
          ],
          "value": 10,
        },
      ]
    `);
    expect(backward).toMatchInlineSnapshot(`
      [
        {
          "op": "replace",
          "path": [
            "list",
            0,
          ],
          "value": 0,
        },
      ]
    `);
  });

  test('remove two and add one at the same time', () => {
    const [forward, backward] = test_(data, (draft) => {
      draft.list.splice(0, 2, 10);
    });

    expect(forward).toMatchInlineSnapshot(`
      [
        {
          "op": "remove",
          "path": [
            "list",
            0,
          ],
        },
        {
          "op": "replace",
          "path": [
            "list",
            0,
          ],
          "value": 10,
        },
      ]
    `);
    expect(backward).toMatchInlineSnapshot(`
      [
        {
          "op": "add",
          "path": [
            "list",
            0,
          ],
          "value": 0,
        },
        {
          "op": "replace",
          "path": [
            "list",
            1,
          ],
          "value": 1,
        },
      ]
    `);
  });

  test('add at first index', () => {
    const [forward, backward] = test_(data, (draft) => {
      draft.list.splice(0, 0, 0);
    });

    expect(forward).toMatchInlineSnapshot(`
      [
        {
          "op": "add",
          "path": [
            "list",
            0,
          ],
          "value": 0,
        },
      ]
    `);
    expect(backward).toMatchInlineSnapshot(`
      [
        {
          "op": "remove",
          "path": [
            "list",
            0,
          ],
        },
      ]
    `);
  });

  test('splice(2, 1); splice(1, 1)', () => {
    const [forward, backward] = test_(data, (draft) => {
      draft.list.splice(2, 1);
      draft.list.splice(1, 1);
    });

    expect(forward).toMatchInlineSnapshot(`
      [
        {
          "op": "remove",
          "path": [
            "list",
            1,
          ],
        },
        {
          "op": "remove",
          "path": [
            "list",
            1,
          ],
        },
      ]
    `);
    expect(backward).toMatchInlineSnapshot(`
      [
        {
          "op": "add",
          "path": [
            "list",
            1,
          ],
          "value": 1,
        },
        {
          "op": "add",
          "path": [
            "list",
            2,
          ],
          "value": 2,
        },
      ]
    `);
  });

  test('splice(1, 1); splice(2, 1)', () => {
    const [forward, backward] = test_(data, (draft) => {
      draft.list.splice(1, 1);
      draft.list.splice(2, 1);
    });

    expect(forward).toMatchInlineSnapshot(`
      [
        {
          "op": "remove",
          "path": [
            "list",
            1,
          ],
        },
        {
          "op": "remove",
          "path": [
            "list",
            1,
          ],
        },
        {
          "op": "replace",
          "path": [
            "list",
            1,
          ],
          "value": 2,
        },
      ]
    `);
    expect(backward).toMatchInlineSnapshot(`
      [
        {
          "op": "add",
          "path": [
            "list",
            1,
          ],
          "value": 1,
        },
        {
          "op": "add",
          "path": [
            "list",
            2,
          ],
          "value": 2,
        },
        {
          "op": "replace",
          "path": [
            "list",
            3,
          ],
          "value": 3,
        },
      ]
    `);
  });

  test('splice(0, 1, 0, 1)', () => {
    const [forward, backward] = test_(data, (draft) => {
      draft.list.splice(0, 1, 0, 1);
    });

    expect(forward).toMatchInlineSnapshot(`
      [
        {
          "op": "add",
          "path": [
            "list",
            1,
          ],
          "value": 1,
        },
      ]
    `);
    expect(backward).toMatchInlineSnapshot(`
      [
        {
          "op": "remove",
          "path": [
            "list",
            1,
          ],
        },
      ]
    `);
  });

  test('push', () => {
    const [forward, backward] = test_(data, (draft) => {
      draft.list.push(100);
    });

    expect(forward).toMatchInlineSnapshot(`
      [
        {
          "op": "add",
          "path": [
            "list",
            100,
          ],
          "value": 100,
        },
      ]
    `);
    expect(backward).toMatchInlineSnapshot(`
      [
        {
          "op": "remove",
          "path": [
            "list",
            100,
          ],
        },
      ]
    `);
  });

  test('push', () => {
    const [forward, backward] = test_(data, (draft) => {
      draft.list.push(100, 101, 102);
    });

    expect(forward).toMatchInlineSnapshot(`
      [
        {
          "op": "add",
          "path": [
            "list",
            100,
          ],
          "value": 100,
        },
        {
          "op": "add",
          "path": [
            "list",
            101,
          ],
          "value": 101,
        },
        {
          "op": "add",
          "path": [
            "list",
            102,
          ],
          "value": 102,
        },
      ]
    `);
    expect(backward).toMatchInlineSnapshot(`
      [
        {
          "op": "remove",
          "path": [
            "list",
            100,
          ],
        },
        {
          "op": "remove",
          "path": [
            "list",
            100,
          ],
        },
        {
          "op": "remove",
          "path": [
            "list",
            100,
          ],
        },
      ]
    `);
  });

  test('pop', () => {
    const [forward, backward] = test_(data, (draft) => {
      draft.list.pop();
    });

    expect(forward).toMatchInlineSnapshot(`
      [
        {
          "op": "remove",
          "path": [
            "list",
            99,
          ],
        },
      ]
    `);
    expect(backward).toMatchInlineSnapshot(`
      [
        {
          "op": "add",
          "path": [
            "list",
            99,
          ],
          "value": 99,
        },
      ]
    `);
  });

  test('push(100, 101); pop()', () => {
    const [forward, backward] = test_(data, (draft) => {
      draft.list.push(100, 101);
      draft.list.pop();
    });

    expect(forward).toMatchInlineSnapshot(`
      [
        {
          "op": "add",
          "path": [
            "list",
            100,
          ],
          "value": 100,
        },
      ]
    `);
    expect(backward).toMatchInlineSnapshot(`
      [
        {
          "op": "remove",
          "path": [
            "list",
            100,
          ],
        },
      ]
    `);
  });

  test('push(100, 101); pop(); push(101)', () => {
    const [forward, backward] = test_(data, (draft) => {
      draft.list.push(100, 101);
      draft.list.pop();
      draft.list.push(101);
    });

    expect(forward).toMatchInlineSnapshot(`
      [
        {
          "op": "add",
          "path": [
            "list",
            100,
          ],
          "value": 100,
        },
        {
          "op": "add",
          "path": [
            "list",
            101,
          ],
          "value": 101,
        },
      ]
    `);
    expect(backward).toMatchInlineSnapshot(`
      [
        {
          "op": "remove",
          "path": [
            "list",
            100,
          ],
        },
        {
          "op": "remove",
          "path": [
            "list",
            100,
          ],
        },
      ]
    `);
  });

  test('pop(); push(99, 100)', () => {
    const [forward, backward] = test_(data, (draft) => {
      draft.list.pop();
      draft.list.push(99, 100);
    });

    expect(forward).toMatchInlineSnapshot(`
      [
        {
          "op": "add",
          "path": [
            "list",
            100,
          ],
          "value": 100,
        },
      ]
    `);
    expect(backward).toMatchInlineSnapshot(`
      [
        {
          "op": "remove",
          "path": [
            "list",
            100,
          ],
        },
      ]
    `);
  });

  test('pop(); push(99, 100); pop()', () => {
    const [forward, backward] = test_(
      { list: data.list.slice(0, 10) },
      (draft) => {
        draft.list.pop();
        draft.list.push(9, 10);
        draft.list.pop();
      }
    );

    expect(forward).toMatchInlineSnapshot(`[]`);
    expect(backward).toMatchInlineSnapshot(`[]`);
  });

  test('unshift()', () => {
    const [forward, backward] = test_(data, (draft) => {
      draft.list.unshift(-1);
    });

    expect(forward).toMatchInlineSnapshot(`
      [
        {
          "op": "add",
          "path": [
            "list",
            0,
          ],
          "value": -1,
        },
      ]
    `);
    expect(backward).toMatchInlineSnapshot(`
      [
        {
          "op": "remove",
          "path": [
            "list",
            0,
          ],
        },
      ]
    `);
  });

  test('shift()', () => {
    const [forward, backward] = test_(data, (draft) => {
      draft.list.shift();
    });

    expect(forward).toMatchInlineSnapshot(`
      [
        {
          "op": "remove",
          "path": [
            "list",
            0,
          ],
        },
      ]
    `);
    expect(backward).toMatchInlineSnapshot(`
      [
        {
          "op": "add",
          "path": [
            "list",
            0,
          ],
          "value": 0,
        },
      ]
    `);
  });

  test('unshift(-2, -1); shift();', () => {
    const [forward, backward] = test_(data, (draft) => {
      draft.list.unshift(-2, -1);
      draft.list.shift();
    });

    expect(forward).toMatchInlineSnapshot(`
      [
        {
          "op": "replace",
          "path": [
            "list",
            0,
          ],
          "value": -1,
        },
        {
          "op": "add",
          "path": [
            "list",
            1,
          ],
          "value": 0,
        },
      ]
    `);
    expect(backward).toMatchInlineSnapshot(`
      [
        {
          "op": "replace",
          "path": [
            "list",
            0,
          ],
          "value": 0,
        },
        {
          "op": "remove",
          "path": [
            "list",
            1,
          ],
        },
      ]
    `);
  });

  test('unshift(-2, -1); shift(); unshift(-2)', () => {
    const [forward, backward] = test_(data, (draft) => {
      draft.list.unshift(-2, -1);
      draft.list.shift();
      draft.list.unshift(-2);
    });

    expect(forward).toMatchInlineSnapshot(`
      [
        {
          "op": "add",
          "path": [
            "list",
            0,
          ],
          "value": -2,
        },
        {
          "op": "add",
          "path": [
            "list",
            1,
          ],
          "value": -1,
        },
      ]
    `);
    expect(backward).toMatchInlineSnapshot(`
      [
        {
          "op": "remove",
          "path": [
            "list",
            0,
          ],
        },
        {
          "op": "remove",
          "path": [
            "list",
            0,
          ],
        },
      ]
    `);
  });

  test('shift(); unshift(-2, -1);', () => {
    const [forward, backward] = test_(data, (draft) => {
      draft.list.shift();
      draft.list.unshift(-1, 0);
    });

    expect(forward).toMatchInlineSnapshot(`
      [
        {
          "op": "replace",
          "path": [
            "list",
            0,
          ],
          "value": -1,
        },
        {
          "op": "add",
          "path": [
            "list",
            1,
          ],
          "value": 0,
        },
      ]
    `);
    expect(backward).toMatchInlineSnapshot(`
      [
        {
          "op": "replace",
          "path": [
            "list",
            0,
          ],
          "value": 0,
        },
        {
          "op": "remove",
          "path": [
            "list",
            1,
          ],
        },
      ]
    `);
  });

  test('shift(); unshift(-2, -1); shift()', () => {
    const [forward, backward] = test_(data, (draft) => {
      draft.list.shift();
      draft.list.unshift(-1, 0);
      draft.list.shift();
    });

    // TODO: optimize
    expect(forward).toMatchInlineSnapshot(`
      [
        {
          "op": "remove",
          "path": [
            "list",
            0,
          ],
        },
        {
          "op": "replace",
          "path": [
            "list",
            0,
          ],
          "value": 0,
        },
        {
          "op": "add",
          "path": [
            "list",
            1,
          ],
          "value": 1,
        },
      ]
    `);
    expect(backward).toMatchInlineSnapshot(`
      [
        {
          "op": "add",
          "path": [
            "list",
            0,
          ],
          "value": 0,
        },
        {
          "op": "replace",
          "path": [
            "list",
            1,
          ],
          "value": 1,
        },
        {
          "op": "remove",
          "path": [
            "list",
            2,
          ],
        },
      ]
    `);
  });

  test('Insert into an index that exceeds the length of the array', () => {
    const [forward, backward] = test_(data, (draft) => {
      draft.list[draft.list.length] = draft.list.length;
    });

    expect(forward).toMatchInlineSnapshot(`
      [
        {
          "op": "add",
          "path": [
            "list",
            100,
          ],
          "value": 100,
        },
      ]
    `);
    expect(backward).toMatchInlineSnapshot(`
      [
        {
          "op": "remove",
          "path": [
            "list",
            100,
          ],
        },
      ]
    `);
  });

  test('Insert into an index that exceeds the length of the array', () => {
    const [forward, backward] = test_(data, (draft) => {
      draft.list[draft.list.length + 1] = draft.list.length + 1;
    });

    expect(forward).toMatchInlineSnapshot(`
      [
        {
          "op": "add",
          "path": [
            "list",
            100,
          ],
          "value": undefined,
        },
        {
          "op": "add",
          "path": [
            "list",
            101,
          ],
          "value": 101,
        },
      ]
    `);
    expect(backward).toMatchInlineSnapshot(`
      [
        {
          "op": "remove",
          "path": [
            "list",
            100,
          ],
        },
        {
          "op": "remove",
          "path": [
            "list",
            100,
          ],
        },
      ]
    `);
  });

  test('splice(1, 3, 1)', () => {
    // 意味のない削除（削除対象がlengthを超えている）
    const [forward, backward] = test_(data, (draft) => {
      draft.list.splice(3, 4, 4);
    });

    expect(forward).toMatchInlineSnapshot(`
      [
        {
          "op": "remove",
          "path": [
            "list",
            3,
          ],
        },
        {
          "op": "remove",
          "path": [
            "list",
            3,
          ],
        },
        {
          "op": "remove",
          "path": [
            "list",
            3,
          ],
        },
        {
          "op": "replace",
          "path": [
            "list",
            3,
          ],
          "value": 4,
        },
      ]
    `);
    expect(backward).toMatchInlineSnapshot(`
      [
        {
          "op": "add",
          "path": [
            "list",
            3,
          ],
          "value": 3,
        },
        {
          "op": "add",
          "path": [
            "list",
            4,
          ],
          "value": 4,
        },
        {
          "op": "add",
          "path": [
            "list",
            5,
          ],
          "value": 5,
        },
        {
          "op": "replace",
          "path": [
            "list",
            6,
          ],
          "value": 6,
        },
      ]
    `);
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
