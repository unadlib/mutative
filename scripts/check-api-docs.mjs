// Fails when `docs/` differs from the API docs that TypeDoc generates from the
// TSDoc comments and exported types of the source, so that a change to them
// comes with the docs that `pnpm build:doc` regenerates.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const docs = join(root, 'docs');
const generated = mkdtempSync(join(tmpdir(), 'mutative-api-docs-'));

function listFiles(dir, base = dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = join(dir, entry.name);
    return entry.isDirectory() ? listFiles(file, base) : [relative(base, file)];
  });
}

try {
  // The options of `typedoc.json`, with another output directory.
  execFileSync(
    join(root, 'node_modules', '.bin', 'typedoc'),
    ['--out', generated, '--logLevel', 'Error'],
    { cwd: root, stdio: 'inherit' }
  );
  const expected = new Set(listFiles(generated));
  const actual = new Set(listFiles(docs));
  const stale = [];
  for (const file of expected) {
    if (!actual.has(file)) {
      stale.push(`missing: docs/${file}`);
    } else if (
      readFileSync(join(generated, file), 'utf8') !==
      readFileSync(join(docs, file), 'utf8')
    ) {
      stale.push(`outdated: docs/${file}`);
    }
  }
  for (const file of actual) {
    if (!expected.has(file)) stale.push(`not generated: docs/${file}`);
  }
  if (stale.length > 0) {
    console.error(
      `The API docs do not match the source; run \`pnpm build:doc\`:\n${stale
        .map((line) => `  ${line}`)
        .join('\n')}`
    );
    process.exitCode = 1;
  } else {
    console.log(`The API docs match the source (${expected.size} files).`);
  }
} finally {
  rmSync(generated, { recursive: true, force: true });
}
