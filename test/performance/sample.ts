// @ts-nocheck
'use strict';

import produce, {
  setAutoFreeze,
  setUseProxies,
  produceWithPatches,
  enablePatches,
} from 'immer';
import { create } from '../..';

// https://github.com/immerjs/immer/issues/867 by default
console.time('create - object: 5k');
const dataSource = Object.fromEntries(
  [...Array(50000).keys()].map((key) => [key, { key, data: { value: key } }])
);
console.timeEnd('create - object: 5k');

console.time('mutative - object: update');
create(dataSource, (draft) => {
  draft[1000].data.value = 100;
});

console.timeEnd('mutative - object: update');

console.time('immer - object: update');
produce(dataSource, (draft) => {
  draft[1000].data.value = 100;
});

console.timeEnd('immer - object: update');

console.time('create - array: 50k');
const dataSource1 = [...Array(50000).keys()].map((key) => [
  key,
  { key, data: { value: key } },
]);
console.timeEnd('create - array: 50k');

console.time('mutative - array: update');
create(dataSource1, (draft) => {
  // @ts-ignore
  draft[1000][1].data.value = 100;
});

console.timeEnd('mutative - array: update');

const f = produce(dataSource1, () => {});
console.time('immer - array: update');
produce(f, (draft) => {
  // @ts-ignore
  draft[1000][1].data.value = 100;
});

console.timeEnd('immer - array: update');
