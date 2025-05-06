// @ts-nocheck
(globalThis as any).__DEV__ = false;
import { produce } from 'immer';
import { create } from '../..';

const objKeySize = 5000;
const objLength = objKeySize - 1;

const arrSize = 50000;
const arrLength = arrSize - 1;
// https://github.com/immerjs/immer/issues/867 by default
console.time(`create - object: ${objKeySize}`);
const dataSource = Object.fromEntries(
  [...Array(objKeySize).keys()].map((key) => [
    key,
    { key, data: { value: key } },
  ])
);
console.timeEnd(`create - object: ${objKeySize}`);

console.time(`reducer - object: ${objKeySize}`);
{
  const _dataSource = {
    ...dataSource,
    [objLength]: { key: objLength, data: { value: objLength } },
  };
}
console.timeEnd(`reducer - object: ${objKeySize}`);

console.time(`mutative - object: update: ${objKeySize}`);
create(dataSource, (draft) => {
  draft[objLength].data.value = objLength;
});

console.timeEnd(`mutative - object: update: ${objKeySize}`);

const a = produce(dataSource, () => {});
console.time(`immer - object: update: ${objKeySize}`);
produce(a, (draft) => {
  draft[objLength].data.value = objLength;
});

console.timeEnd(`immer - object: update: ${objKeySize}`);

console.log('===========================');

console.time(`create - array: ${arrSize}`);
const dataSource1 = [...Array(arrSize).keys()].map((key) => [
  key,
  { key, data: { value: key } },
]);
console.timeEnd(`create - array: ${arrSize}`);

console.time(`reducer - array: ${arrSize}`);
{
  const _dataSource = [
    ...dataSource1.slice(0, arrLength),
    [arrLength, { key: arrLength, data: { value: arrLength } }],
  ];
}
console.timeEnd(`reducer - array: ${arrSize}`);

console.time(`mutative - array: update: ${arrSize}`);
create(dataSource1, (draft) => {
  // @ts-ignore
  draft[arrLength][1].data.value = arrLength;
});

console.timeEnd(`mutative - array: update: ${arrSize}`);

const f = produce(dataSource1, () => {});
console.time(`immer - array: update: ${arrSize}`);
produce(f, (draft) => {
  // @ts-ignore
  draft[arrLength][1].data.value = arrLength;
});

console.timeEnd(`immer - array: update: ${arrSize}`);
