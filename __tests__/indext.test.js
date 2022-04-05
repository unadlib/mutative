import { convertToImmutable } from '../src/recordTuple';

const Tuple = require('@bloomberg/record-tuple-polyfill').Tuple;
const Record = require('@bloomberg/record-tuple-polyfill').Record;

globalThis.Tuple = Tuple;
globalThis.Record = Record;

// baseState.arr = Array(10 ** 5)
//   .fill('')
//   .map(() => createTestObject());

// Array(10 ** 3)
//   .fill(1)
//   .forEach((_, i) => {
//     baseState.map[i] = { i };
//   });

test('base convert', () => {
  expect(convertToImmutable({ foo: 'bar' })).toBe(
    convertToImmutable({ foo: 'bar' })
  );
  expect(
    convertToImmutable({ foo: 'bar', arr: convertToImmutable([1, 2, 3]) })
  ).toBe(
    convertToImmutable({ foo: 'bar', arr: convertToImmutable([1, 2, 3]) })
  );
});
