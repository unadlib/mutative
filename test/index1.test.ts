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
import { apply, create } from '../src';
import { deepClone } from '../src/utils';

test('classic case', () => {
  const data = {
    a: [{ i: 0 }, { i: 1 }, { i: 2 }],
  };
  function checkPatches<T>(data: T, fn: (checkPatches: T) => void) {
    const [state, patches, inversePatches] = create(data as any, fn, {
      enablePatches: true,
    }) as any;
    const mutatedResult = deepClone(data);
    fn(mutatedResult);
    expect(state).toEqual(mutatedResult);
    console.log('state', state);
    console.log('mutatedResult', mutatedResult);
    // expect(patches).toMatchSnapshot();
    // expect(inversePatches).toMatchSnapshot();
    // const prevState = apply(state, inversePatches);
    // expect(prevState).toEqual(data);
    // const nextState = apply(data as any, patches);
    // expect(nextState).toEqual(state);
    return [patches, inversePatches];
  }
  const fn = (draft: any) => {
    draft.a.unshift({ i: -1 });
    draft.a.copyWithin(0, 1, 2);
  };
  const [patches, inversePatches] = checkPatches(data, fn);
  const [patches2, inversePatches2] = checkPatches(data, fn);
  console.log('true', patches);
  // console.log('false', patches2);
  enablePatches();
  const [_, patches3, inversePatches3] = produceWithPatches(data, fn);
  console.log('immer', patches3);
  expect(patches).toEqual(patches2);
  expect(inversePatches).toEqual(inversePatches2);
});
