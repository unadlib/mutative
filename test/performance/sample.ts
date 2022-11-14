import produce, {
  setAutoFreeze,
  setUseProxies,
  produceWithPatches,
  enablePatches,
} from 'immer';
import { create } from '../../src';

// https://github.com/immerjs/immer/issues/867 by default
console.time('create');
const dataSource = Object.fromEntries(
  [...Array(4000).keys()].map((key) => [key, { key, data: { value: key } }])
);
console.timeEnd('create');

console.time('immer - update');
produce(dataSource, (draft) => {
  draft[1000].data.value = 100;
});

console.timeEnd('immer - update');

console.time('mutative - update');
create(dataSource, (draft) => {
  draft[1000].data.value = 100;
});

console.timeEnd('mutative - update');
