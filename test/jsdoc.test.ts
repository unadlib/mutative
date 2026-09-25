import { existsSync, readFileSync, writeFileSync } from 'fs';
import { basename, resolve } from 'path';

// Run the ```ts examples in the JSDoc comments of a source file. Each one is
// written next to this file as `<name>.<index>.snap.ts` and then imported, so
// that it goes through Vitest's transform pipeline.
const jsdocTests = async (path: string, dirname: string) => {
  const filePath = resolve(dirname, path);
  const filename = basename(filePath, '.ts');
  const source = readFileSync(filePath, 'utf8');
  let index = 0;
  for (const [comment] of source.matchAll(/\/\*\*\n[\s\S]*?\*\//g)) {
    const markdown = comment.replace(/^[ \t]*\* ?/gm, '');
    for (const [, code] of markdown.matchAll(
      /^```(?:js|javascript|ts|typescript)\n([\s\S]*?)^```/gm
    )) {
      const snapPath = resolve(dirname, `${filename}.${index}.snap.ts`);
      if (!existsSync(snapPath) || readFileSync(snapPath, 'utf8') !== code) {
        writeFileSync(snapPath, code, 'utf8');
      }
      await import(snapPath);
      index += 1;
    }
  }
};

describe('jsdoc', () => {
  test('create()', async () => {
    await jsdocTests('../src/create.ts', __dirname);
  });
  test('apply()', async () => {
    await jsdocTests('../src/apply.ts', __dirname);
  });
  test('current()', async () => {
    await jsdocTests('../src/current.ts', __dirname);
  });
  test('original()', async () => {
    await jsdocTests('../src/original.ts', __dirname);
  });
  test('unsafe()', async () => {
    await jsdocTests('../src/unsafe.ts', __dirname);
  });
  test('rawReturn()', async () => {
    await jsdocTests('../src/rawReturn.ts', __dirname);
  });
  test('makeCreator()', async () => {
    await jsdocTests('../src/makeCreator.ts', __dirname);
  });
});
