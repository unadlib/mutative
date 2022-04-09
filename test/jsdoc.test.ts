import { jsdocTests } from 'jsdoc-tests';

test('test with jsdoc', () => {
  jsdocTests('../src/index.ts', __dirname, require);
});
