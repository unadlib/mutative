import produce from 'immer';
import { create } from '../src';

describe('performance', () => {
  test('object', () => {
    const baseState: Record<string, any> = {};
    Array(10 ** 5)
      .fill(1)
      .forEach((_, i) => {
        baseState[i] = { i };
      });
    console.time('mutative - performance 100k key in object');
    create(baseState, (draft) => {
      draft[0].c = { i: 0 };
    });
    console.timeEnd('mutative - performance 100k key in object');

    console.time('immer - performance 100k key in object');
    produce(baseState, (draft) => {
      draft[0].c = { i: 0 };
    });
    console.timeEnd('immer - performance 100k key in object');
  });

  test('array', () => {
    const a = Array(10 ** 5)
      .fill(1)
      .map((_, i) => ({ [i]: i }));
    console.time('mutative - performance 100k');
    create({ b: { c: 2 }, a }, (draft) => {
      draft.b.c = 3;
      draft.a.push({ '1': 1 });
    });
    console.timeEnd('mutative - performance 100k');

    console.time('immer - performance for 100k items in array');
    produce({ b: { c: 2 }, a }, (draft) => {
      draft.b.c = 3;
      draft.a.push({ '1': 1 });
    });
    console.timeEnd('immer - performance for 100k items in array');
  });
});
