import { jsdocTests } from 'jsdoc-tests';

describe('jsdoc', () => {
  test('create()', () => {
    jsdocTests('../src/create.ts', __dirname, require);
  });
  test('apply()', () => {
    jsdocTests('../src/apply.ts', __dirname, require);
  });
  test('draftify()', () => {
    jsdocTests('../src/draftify.ts', __dirname, require);
  });
  test('current()', () => {
    jsdocTests('../src/current.ts', __dirname, require);
  });
  test('original()', () => {
    jsdocTests('../src/original.ts', __dirname, require);
  });
});
