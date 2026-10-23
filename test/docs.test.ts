import { readdirSync, readFileSync } from 'fs';
import { join, relative, resolve } from 'path';
import { transformSync } from 'esbuild';
import * as immer from 'immer';
import * as mutative from '../src';
import * as lite from '../src/lite';

// Run the code examples of the README, of the website docs and of the 2.0
// announcement. An example that imports from `mutative` or `immer`, and from
// no other module, must run as it is written, so that the docs cannot drift
// from the library. Examples that import `mutative/lite` run with its
// constants, in `pnpm test:lite`.

const root = resolve(__dirname, '..');

const modules: Record<string, unknown> = { mutative, immer };
if (!__MAP_SET__ && !__PATCHES__ && !__ARRAY_METHODS__) {
  modules['mutative/lite'] = lite;
}

function listDocs(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return listDocs(path);
    return entry.name.endsWith('.mdx') ? [path] : [];
  });
}

const files = [
  join(root, 'README.md'),
  ...listDocs(join(root, 'website/content/docs')),
  // Earlier posts describe the library as it was when they were published.
  join(root, 'website/content/blog/releases/2.0/index.mdx'),
];

interface Example {
  line: number;
  code: string;
}

const fence = /^```(ts|typescript|js|javascript)\b[^\n]*\n([\s\S]*?)^```/gm;
const importStatement =
  /^import\s+(type\s+)?([\s\S]*?)\s+from\s+['"]([^'"]+)['"];?[ \t]*$/gm;

function getExamples(markdown: string): Example[] {
  const examples: Example[] = [];
  for (const match of markdown.matchAll(fence)) {
    const code = match[2];
    const sources = [...code.matchAll(importStatement)].map(
      (statement) => statement[3]
    );
    if (sources.length > 0 && sources.every((source) => source in modules)) {
      const line = markdown.slice(0, match.index).split('\n').length;
      examples.push({ line, code });
    }
  }
  return examples;
}

// `import { a, b as c } from 'm'` becomes `const { a, b: c } = modules['m']`.
function bindImports(code: string) {
  return code.replace(
    importStatement,
    (_statement, typeOnly: string | undefined, clause: string, source) => {
      if (typeOnly) return '';
      const module = `__modules[${JSON.stringify(source)}]`;
      const bindings: string[] = [];
      const named = clause.match(/\{([\s\S]*)\}/);
      const rest = clause
        .replace(/\{[\s\S]*\}/, '')
        .replace(/,/g, ' ')
        .trim();
      if (rest.startsWith('* as ')) {
        bindings.push(`const ${rest.slice(5).trim()} = ${module};`);
      } else if (rest) {
        bindings.push(`const ${rest} = ${module}.default;`);
      }
      if (named) {
        const names = named[1]
          .split(',')
          .map((name) => name.trim())
          .filter((name) => name && !name.startsWith('type '))
          .map((name) => name.replace(/\s+as\s+/, ': '));
        bindings.push(`const { ${names.join(', ')} } = ${module};`);
      }
      return bindings.join(' ');
    }
  );
}

const AsyncFunction = (async () => {}).constructor as new (
  ...args: string[]
) => (...args: unknown[]) => Promise<unknown>;

// An example runs as the body of an async function, so it can await, and the
// declarations that it exports become local ones.
function unexport(code: string) {
  return code.replace(
    /^export (?=(async |const |let |function |class ))/gm,
    ''
  );
}

async function runExample(code: string) {
  const { code: script } = transformSync(unexport(bindImports(code)), {
    loader: 'ts',
  });
  await new AsyncFunction('__modules', 'expect', script)(modules, expect);
}

const documents = files
  .map((file) => ({
    name: relative(root, file),
    examples: getExamples(readFileSync(file, 'utf8')),
  }))
  .filter(({ examples }) => examples.length > 0);

// `%s` keeps the whole path in the name, where `$name` would shorten it.
describe.each(documents.map(({ name, examples }) => [name, examples] as const))(
  '%s',
  (_name, examples) => {
    test.each(examples)('the example at line $line', async ({ code }) => {
      // Examples may log, and development builds warn about some of them.
      const log = vi.spyOn(console, 'log').mockImplementation(() => {});
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      try {
        await runExample(code);
      } finally {
        log.mockRestore();
        warn.mockRestore();
      }
    });
  }
);

describe('website/content/docs/extra-topics/errors.mdx', () => {
  const page = readFileSync(
    join(root, 'website/content/docs/extra-topics/errors.mdx'),
    'utf8'
  );
  const rows = [...page.matchAll(/^\| +(\d+) \| `(\w+)`[^|]*\| (.+) \|$/gm)];
  const placeholders: Record<number, unknown[]> = {
    7: ['<value>'],
    9: ['<result>'],
    14: [['<path>']],
    16: ['<op>'],
    18: ['<value>'],
  };

  test('lists every error code with its development message', async () => {
    const { die } = await import('../src/error');
    const source = readFileSync(join(root, 'src/error.ts'), 'utf8');
    const codes = [...source.matchAll(/^ {2}(\w+) = (\d+),$/gm)].map(
      ([, name, code]) => [Number(code), name] as const
    );
    expect(rows.map(([, code, name]) => [Number(code), name])).toEqual(
      [...codes, [12, 'InvalidPatchPath']].sort((a, b) => +a[0] - +b[0])
    );
    // Code 12 is retired, so no development message remains for it.
    for (const [, code, , message] of rows.filter((row) => row[1] !== '12')) {
      let error: unknown;
      try {
        (die as (code: number, ...args: unknown[]) => never)(
          Number(code),
          ...(placeholders[Number(code)] ?? [])
        );
      } catch (thrown) {
        error = thrown;
      }
      expect((error as Error).message).toBe(message.replace(/^`|`$/g, ''));
    }
  });
});

describe('website/lib/benchmarks.ts', () => {
  const read = (path: string) => readFileSync(join(root, path), 'utf8');
  // The text from a heading to the next heading of its level.
  const section = (text: string, heading: string) => {
    const level = heading.match(/^#+/)![0];
    const start = text.indexOf(`\n${heading}\n`);
    expect(start, heading).not.toBe(-1);
    const end = text.indexOf(`\n${level} `, start + heading.length + 2);
    return text.slice(start, end === -1 ? undefined : end);
  };
  const summary = read('perf-testing/reports/SUMMARY.md');

  test('holds the run and the speedups of the performance summary', async () => {
    const { benchmarkRun, speedups } =
      await import('../website/lib/benchmarks');
    const scope = section(summary, '## Scope and method');
    expect(scope).toContain(`${benchmarkRun.machine},`);
    expect(scope).toContain(`Node ${benchmarkRun.node},`);
    expect(scope).toContain(`${benchmarkRun.workloads} scenarios at 100 rows`);
    expect(summary).toContain(`Immer is pinned to ${benchmarkRun.immer} `);
    // The last column of the results holds all cells: faster / within 5% /
    // slower of all, and the geometric mean.
    const results = section(summary, '### Against Immer and Mutative 1.3.0');
    for (const [comparator, speedup] of [
      [`Immer ${benchmarkRun.immer}`, speedups.matched],
      [`Immer ${benchmarkRun.immer} with its defaults`, speedups.defaults],
    ] as const) {
      const row = results
        .split('\n')
        .find((line) => line.startsWith(`| ${comparator} |`));
      const [, faster, cases, mean] =
        row?.match(/\| (\d+) \/ \d+ \/ \d+ of (\d+), ([\d.]+) \|$/) ?? [];
      expect({
        comparator,
        faster,
        cases,
        factor: Number(mean).toFixed(1),
      }).toEqual({
        comparator,
        faster: String(speedup.faster),
        cases: String(speedup.cases),
        factor: speedup.factor.toFixed(1),
      });
    }
  });

  test('charts the times of the README and the performance page', async () => {
    const { chartWorkloads } = await import('../website/lib/benchmarks');
    const tables = {
      'README.md': section(read('README.md'), '## Performance'),
      'performance.mdx': section(
        read('website/content/docs/getting-started/performance.mdx'),
        '## Mutative vs Immer'
      ),
    };
    for (const [name, table] of Object.entries(tables)) {
      for (const workload of chartWorkloads) {
        // | Workload | Rows | Mutative | Immer | Immer, auto-freeze | Hand-written |
        const cells = table
          .split('\n')
          .map((line) => line.split('|').map((cell) => cell.trim()))
          .find((row) => row[1] === workload.name);
        expect({ name, cells: cells?.slice(1, 6) }).toEqual({
          name,
          cells: [
            workload.name,
            workload.rows,
            workload.mutative,
            workload.immer,
            workload.immerAutoFreeze,
          ],
        });
      }
    }
  });
});
