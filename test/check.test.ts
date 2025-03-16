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
import {
  produce,
  enableMapSet,
  setAutoFreeze,
  Immutable,
  produceWithPatches,
  enablePatches,
  applyPatches,
  setUseStrictShallowCopy,
  current as immerCurrent,
  createDraft,
  finishDraft,
  immerable,
} from 'immer';
import { create, apply, Patches, original } from '../src';
import { deepClone, isDraft, set } from '../src/utils';

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
  return [patches, inversePatches];
}

test('shift', () => {
  const obj = {
    a: Array.from({ length: 3 }, (_, i) => ({ i })),
    o: { b: { c: 1 } },
  };
  const fn = (draft: any) => {
    // draft.a[2].i++;
    // const a = draft.a.shift()!;
    // a.i++;
    // draft.a.push(a);
    draft.a.unshift({ i: 42 });
    draft.a.unshift({ i: 41 });
    draft.a.reverse();
  };
  {
    enablePatches();
    const [state, patches, inversePatches] = produceWithPatches(obj, fn);
    console.log('immer patches:', patches);
    console.log('immer inversePatches:', inversePatches);
  }
  {
    const [patches, inversePatches] = checkPatches(obj, fn);

    console.log('mutative patches', patches);
    console.log('mutative inversePatches', inversePatches);
  }
});

// test('unshift - 1', () => {
//   const obj = {
//     a: Array.from({ length: 3 }, (_, i) => ({ i })),
//     o: { b: { c: 1 } },
//   };
//   checkPatches(obj, (draft) => {
//     draft.a.unshift({ i: 42 });
//     draft.a.sort((a, b) => b.i - a.i);
//     draft.a.reverse();
//   });
// });
