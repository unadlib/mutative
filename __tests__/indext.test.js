import semver from 'semver';
import { convertToImmutable } from '../src/recordTuple';
import { create } from '../src';

const supported = semver.gt(process.version, 'v14.6.0');

if (supported) {
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

  test('base create', () => {
    const baseState = { list: [], map: {} };
    const { state } = create(
      baseState,
      (draftState) => {
        draftState.list.push({ text: 'foo' });
      },
      {
        enableRecordTuple: true,
      }
    );
    expect(state).not.toBe(convertToImmutable(baseState));
    expect(state).toBe(
      Record({ list: Tuple.from([Record({ text: 'foo' })]), map: Record({}) })
    );

    const { state: state1 } = create(
      state,
      (draftState) => {
        draftState.list.push({ text: 'foo1' });
        draftState.map.foo = 'foobar';
      },
      {
        enableRecordTuple: true,
      }
    );
    expect(state1).not.toBe(state);
    expect(state1).toBe(
      Record({
        list: Tuple.from([Record({ text: 'foo' }), Record({ text: 'foo1' })]),
        map: Record({ foo: 'foobar' }),
      })
    );

    const { state: state2 } = create(
      state1,
      (draftState) => {
        draftState.map.foo = 'foobar1';
        draftState.map = { foo: 'foobar' };
      },
      {
        enableRecordTuple: true,
      }
    );
    expect(state2).toBe(state1);
  });
} else {
  test.skip('', () => {});
}
