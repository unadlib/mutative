import { compare } from 'fast-json-patch';
import { apply, create } from '../src';

test('', () => {
  const stateA = { '/a': { '/~1a/~1b': [1, 2, 3] } };
  const stateB = { '/a': { '/~1a/~1b': [3, 2, 1] } };
  expect(apply(stateA, compare(stateA, stateB) as any)).toEqual(stateB);
});

test('', () => {
  const [state, patches, inversePatches] = create(
    { list: [1, 2, 3] },
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
  console.log(state, patches, inversePatches);
});

test('', () => {
  const [state, patches, inversePatches] = create(
    { list: [1, 2, 3] },
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
  console.log(state, patches, inversePatches);
});
