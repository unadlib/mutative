/* eslint-disable prefer-template */
// @ts-nocheck
(globalThis as any).__DEV__ = false;
import { produce } from 'immer';
import { create } from '../../..';
import { createTable, updateTable } from './mockPhysics';

const iterations = 5000;
const ballCount = 30;
const readOnly = true;

function deepProxy(target, handler) {
  const wrap = (target) => {
    if (typeof target !== 'object' || target === null) {
      return target;
    }
    return new Proxy(target, handler);
  };
  return wrap(target);
}
let k = 0;
const x: WeakMap<any, any> = new WeakMap();

// example usage
const handler = {
  get(target, prop, receiver) {
    k++;
    const value = target[prop];
    if (typeof value !== 'object' || value === null) {
      return value;
    }
    const f = x.get(target);
    if (!f) {
      x.set(target, new Map());
    } else {
      const k = f.get(prop);
      if (k) {
        return k;
      }
    }
    const g = new Proxy(value, handler);
    x.get(target).set(prop, g);
    return g;
  },
};

console.log(new Date());
console.log(
  'Iterations=' + iterations + ' Balls=' + ballCount + ' ReadOnly=' + readOnly
);
console.log();
let rawTable = createTable(ballCount);
let before = Date.now();
for (let i = 0; i < iterations; i++) {
  updateTable(rawTable, readOnly);
}
let after = Date.now();
console.log(
  'RAW     : ' +
    iterations +
    ' iterations @' +
    (after - before) +
    'ms  (' +
    (after - before) / iterations +
    ' per loop)'
);

let rawCopyTable = createTable(ballCount);
before = Date.now();
for (let i = 0; i < iterations; i++) {
  rawCopyTable = JSON.parse(
    JSON.stringify(updateTable(rawCopyTable, readOnly))
  );
}
after = Date.now();
console.log(
  'RAW+COPY: ' +
    iterations +
    ' iterations @' +
    (after - before) +
    'ms  (' +
    (after - before) / iterations +
    ' per loop)'
);

let mutativeTable = createTable(ballCount);
before = Date.now();
for (let i = 0; i < iterations; i++) {
  const beforeTable = mutativeTable;
  mutativeTable = create(mutativeTable, (draft) => {
    updateTable(draft, readOnly);
  });
  // if (beforeTable !== mutativeTable && readOnly) {
  //   console.log('ERROR - change detected');
  //   // @ts-ignore
  //   process.exit(0);
  // }
}
after = Date.now();
console.log(
  'MUTATIVE: ' +
    iterations +
    ' iterations @' +
    (after - before) +
    'ms  (' +
    (after - before) / iterations +
    ' per loop)'
);

let immerTable1 = createTable(ballCount);
before = Date.now();
for (let i = 0; i < iterations; i++) {
  const beforeTable = immerTable1;
  // immerTable = produce(immerTable, (draft) => {});
  const deepProxiedObject = deepProxy(immerTable1, handler);
  updateTable(deepProxiedObject, readOnly);
  if (beforeTable !== immerTable1 && readOnly) {
    console.log('ERROR - change detected');
    // @ts-ignore
    process.exit(0);
  }
}
after = Date.now();
console.log(
  'RAW+PROXY: ' +
    iterations +
    ' iterations @' +
    (after - before) +
    'ms  (' +
    (after - before) / iterations +
    ' per loop)'
);

let immerTable = createTable(ballCount);
before = Date.now();
for (let i = 0; i < iterations; i++) {
  const beforeTable = immerTable;
  immerTable = produce(immerTable, (draft) => {
    updateTable(draft, readOnly);
  });
  if (beforeTable !== immerTable && readOnly) {
    console.log('ERROR - change detected');
    process.exit(0);
  }
}
after = Date.now();
console.log(
  'IMMER   : ' +
    iterations +
    ' iterations @' +
    (after - before) +
    'ms  (' +
    (after - before) / iterations +
    ' per loop)'
);
