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
        "op": "remove",
        "path": [
          "list",
          2,
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
        "op": "remove",
        "path": [
          "list",
          0,
        ],
      },
    ]
  `);
  expect(inversePatches).toMatchInlineSnapshot(`
    [
      {
        "op": "add",
        "path": [
          "list",
          0,
        ],
        "value": 1,
      },
      {
        "op": "add",
        "path": [
          "list",
          1,
        ],
        "value": 2,
      },
      {
        "op": "add",
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
          "length",
        ],
        "value": 0,
      },
    ]
  `);
  expect(inversePatches).toMatchInlineSnapshot(`
    [
      {
        "op": "add",
        "path": [
          "list",
          0,
        ],
        "value": 1,
      },
      {
        "op": "add",
        "path": [
          "list",
          1,
        ],
        "value": 2,
      },
      {
        "op": "add",
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
        "path": "/list/length",
        "value": 0,
      },
    ]
  `);
  expect(inversePatches).toMatchInlineSnapshot(`
    [
      {
        "op": "add",
        "path": "/list/0",
        "value": 1,
      },
      {
        "op": "add",
        "path": "/list/1",
        "value": 2,
      },
      {
        "op": "add",
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
        "path": "/list/length",
        "value": 0,
      },
    ]
  `);
  expect(inversePatches).toMatchInlineSnapshot(`
    [
      {
        "op": "add",
        "path": "/list/0",
        "value": 1,
      },
      {
        "op": "add",
        "path": "/list/1",
        "value": 2,
      },
      {
        "op": "add",
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
