// @ts-nocheck
'use strict';
(globalThis as any).__DEV__ = false;
import { create, MutativeMap } from '../..';
import { measure } from '../__immer_performance_tests__/measure';


// TODO [performance] use minified version for benchmarks and performance tests. Apparently as it worked sometime without __DEV__ being defined and indicated by setting NODE_ENV=production, this probably already happened sometime but was broken since?

const MAX = 100;

const getData = (mapClass: any) => {
  const baseState = {
    // set: new Set(
    //   Array(10 ** 4 * 5)
    //     .fill('')
    //     .map((_, i) => ({ [i]: i }))
    // ),
    map: new mapClass(
      Array(10 ** 4 * 5)
        .fill('')
        .map((_, i) => [i, { [i]: i }])
    ),
  };
  return baseState;
};

interface BaseState {
  // set: Set<{
  //   [x: number]: number;
  // }>;
  map: Map<
    number,
    {
      [x: number]: number;
    }
  > | MutativeMap<
    number,
    {
      [x: number]: number;
    }
  >;
}

measure(
  'mutative - normal Map',
  () => getData(Map),
  (baseState: BaseState) => {
    for (let i = 0; i < MAX; i++) {
      const state = create(baseState, (draft) => {
        // draft.set.add({ [i]: i });
        draft.map.get(i)[i] = i.toString();
      });
    }
  }
);

measure(
  'mutative - MutativeMap',
  () => getData(MutativeMap),
  (baseState: BaseState) => {
    for (let i = 0; i < MAX; i++) {
      const state = create(baseState, (draft) => {
        // draft.set.add({ [i]: i });
        draft.map.get(i)[i] = i.toString();
      });
    }
  }
);

// measure(
//   'tmpRoot - mutative - normal Map',
//   () => getData(Map).map,
//   (baseState: BaseState) => {
//     for (let i = 0; i < MAX; i++) {
//       const state = create(baseState, (draft) => {
//         // draft.set.add({ [i]: i });
//         draft.get(i)[i] = i.toString();
//       });
//     }
//   }
// );
//
// measure(
//   'tmpRoot - mutative - MutativeMap',
//   () => getData(MutativeMap).map,
//   (baseState: BaseState) => {
//     for (let i = 0; i < MAX; i++) {
//       const state = create(baseState, (draft) => {
//         // draft.set.add({ [i]: i });
//         draft.get(i)[i] = i.toString();
//       });
//     }
//   }
// );
