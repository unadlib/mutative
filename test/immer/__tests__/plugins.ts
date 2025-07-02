// @ts-nocheck
import { produce, produceWithPatches, applyPatches } from '../src/immer';

test('error when using Maps', () => {
  // !!! This is different from immer
  expect(() => {
    produce(new Map(), function () {});
  }).not.toThrow();
});

test('error when using patches - 1', () => {
  // !!! This is different from immer
  expect(() => {
    produce(
      {},
      function () {},
      function () {}
    );
  }).not.toThrow();
});

test('error when using patches - 2', () => {
  // !!! This is different from immer
  expect(() => {
    produceWithPatches({}, function () {});
  }).not.toThrow();
});

test('error when using patches - 3', () => {
  // !!! This is different from immer
  expect(() => {
    applyPatches({}, []);
  }).not.toThrow();
});
