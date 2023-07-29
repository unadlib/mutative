import { jsdocTests } from 'jsdoc-tests';

describe('jsdoc', () => {
  test('create()', () => {
    jsdocTests('../src/create.ts', __dirname);
  });
  test('apply()', () => {
    jsdocTests('../src/apply.ts', __dirname);
  });
  test('current()', () => {
    jsdocTests('../src/current.ts', __dirname);
  });
  test('original()', () => {
    jsdocTests('../src/original.ts', __dirname);
  });
  test('unsafe()', () => {
    jsdocTests('../src/unsafe.ts', __dirname);
  });
  test('rawReturn()', () => {
    jsdocTests('../src/rawReturn.ts', __dirname);
  });
  test('makeCreator()', () => {
    jsdocTests('../src/makeCreator.ts', __dirname);
  });
});
