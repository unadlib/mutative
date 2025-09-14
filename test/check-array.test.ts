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

test('unshift - 1', () => {
  const obj = {
    a: Array.from({ length: 3 }, (_, i) => ({ i })),
    o: { b: { c: 1 } },
  };
  checkPatches(obj, (draft) => {
    draft.a.unshift({ i: 42 });
    draft.a.sort((a, b) => b.i - a.i);
    draft.a.reverse();
  });
});

// TODO: fix this test
test.skip('shift', () => {
  const obj = {
    a: Array.from({ length: 20 }, (_, i) => ({ i })),
    o: { b: { c: 1 } },
  };
  checkPatches(obj, (draft) => {
    const a = draft.a.shift()!;
    a.i++;
    draft.a.push(a);
  });
});

test('unshift', () => {
  const obj = {
    a: Array.from({ length: 20 }, (_, i) => ({ i })),
    o: { b: { c: 1 } },
  };
  checkPatches(obj, (draft) => {
    draft.a.unshift({ i: 42 });
  });
});

// TODO: fix this test
test.skip('splice', () => {
  const obj = {
    a: Array.from({ length: 20 }, (_, i) => ({ i })),
    o: { b: { c: 1 } },
  };
  checkPatches(obj, (draft) => {
    const [a] = draft.a.splice(0, 1)!;
    a.i++;
    draft.a.push(a);
  });
});

// TODO: fix this test
test.skip('splice - 1', () => {
  const obj = {
    a: Array.from({ length: 20 }, (_, i) => ({ i })),
    o: { b: { c: 1 } },
  };
  checkPatches(obj, (draft) => {
    draft.o.b.c++;
    const b = draft.o.b;
    // @ts-ignore
    delete draft.o.b;
    // @ts-ignore
    const [a] = draft.a.splice(0, 1, { i: 42 }, { c: { d: { b } } })!;
    a.i++;
    draft.a.push(a);
  });
});

test('reverse', () => {
  const obj = {
    a: Array.from({ length: 20 }, (_, i) => ({ i })),
    o: { b: { c: 1 } },
  };
  checkPatches(obj, (draft) => {
    draft.a.reverse();
  });
});

test('sort', () => {
  const obj = {
    a: Array.from({ length: 20 }, (_, i) => ({ i })),
    o: { b: { c: 1 } },
  };
  checkPatches(obj, (draft) => {
    draft.a.sort((a, b) => b.i - a.i);
  });
});

// TODO: fix this test
test.skip('shift - 1', () => {
  const obj = {
    a: Array.from({ length: 20 }, (_, i) => ({ i })),
    o: { b: { c: 1 } },
  };
  checkPatches(obj, (draft) => {
    draft.a[2].i++;
    const a = draft.a.shift()!;
    a.i++;
    draft.a.push(a);
    draft.a.sort((a, b) => b.i - a.i);
    draft.a.unshift({ i: 42 });
    draft.a.reverse();
  });
});

test('unshift - 1', () => {
  const obj = {
    a: Array.from({ length: 20 }, (_, i) => ({ i })),
    o: { b: { c: 1 } },
  };
  checkPatches(obj, (draft) => {
    draft.a.unshift({ i: 42 });
    draft.a.sort((a, b) => b.i - a.i);
    draft.a.reverse();
  });
});

// TODO: fix this test
test.skip('splice - 1', () => {
  const obj = {
    a: Array.from({ length: 20 }, (_, i) => ({ i })),
    o: { b: { c: 1 } },
  };
  checkPatches(obj, (draft) => {
    draft.a[2].i++;
    const a = draft.a.splice(0, 1)!;
    a[0].i++;
    // @ts-ignore
    draft.a.push(a);
  });
});

test('reverse - 1', () => {
  const obj = {
    a: Array.from({ length: 20 }, (_, i) => ({ i })),
    o: { b: { c: 1 } },
  };
  checkPatches(obj, (draft) => {
    draft.a[2].i++;
    draft.a.reverse();
    draft.a.sort((a, b) => b.i - a.i);
    draft.a.unshift({ i: 42 });
    draft.a[0].i++;
  });
});

test('sort - 1', () => {
  const obj = {
    a: Array.from({ length: 20 }, (_, i) => ({ i })),
    o: { b: { c: 1 } },
  };
  checkPatches(obj, (draft) => {
    draft.a.sort((a, b) => {
      // @ts-ignore
      a._i = 1;
      // @ts-ignore
      b._i = 1;
      return b.i - a.i;
    });
    draft.a.reverse();
    draft.a.unshift({ i: 42 });
    draft.a[0].i++;
  });
});

test('copyWithin - 1', () => {
  const obj = {
    a: Array.from({ length: 20 }, (_, i) => ({ i })),
    o: { b: { c: 1 } },
  };
  checkPatches(obj, (draft) => {
    draft.a.copyWithin(0, 3, 5);
    draft.a.reverse();
    draft.a.unshift({ i: 42 });
    draft.a[0].i++;
  });
});

test('copyWithin - 2', () => {
  const obj = {
    a: Array.from({ length: 20 }, (_, i) => ({ i })),
    o: { b: { c: 1 } },
  };
  checkPatches(obj, (draft) => {
    draft.a.copyWithin(1,3);
    draft.a.reverse();
    draft.a.unshift({ i: 42 });
    draft.a[0].i++;
  });
});
