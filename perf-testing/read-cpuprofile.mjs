import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { SourceMap } from 'node:module';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = dirname(fileURLToPath(import.meta.url));
const root = dirname(directory);
const results = join(directory, 'results');
const latest = () =>
  existsSync(results)
    ? readdirSync(results)
        .filter((name) => name.endsWith('.cpuprofile'))
        .map((name) => join(results, name))
        .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)[0]
    : null;
const profilePath = process.argv[2] ? resolve(process.argv[2]) : latest();
if (!profilePath)
  throw new Error('Usage: pnpm profile:immer:analyze [path-to-cpuprofile]');
const profile = JSON.parse(readFileSync(profilePath, 'utf8'));
assert.equal(
  profile.samples?.length,
  profile.timeDeltas?.length,
  'CPU samples require matching time deltas'
);
assert.ok(
  profile.samples?.length,
  'Profile contains no samples; increase --iterations'
);
const parents = new Map(
  profile.nodes.flatMap((node) =>
    (node.children ?? []).map((id) => [id, node.id])
  )
);
const sourceMaps = new Map();
const descriptions = new Map();

function describe(node) {
  const frame = node.callFrame;
  let source = frame.url;
  let line = frame.lineNumber;
  let name = frame.functionName || '(anonymous)';
  if (source?.startsWith('file://') || source?.startsWith('/')) {
    const script = source.startsWith('file://')
      ? fileURLToPath(source)
      : source;
    if (!sourceMaps.has(script)) {
      const mapPath = `${script}.map`;
      sourceMaps.set(
        script,
        existsSync(mapPath)
          ? new SourceMap(JSON.parse(readFileSync(mapPath, 'utf8')))
          : null
      );
    }
    const entry = sourceMaps
      .get(script)
      ?.findEntry(frame.lineNumber, frame.columnNumber);
    if (entry?.originalSource) {
      source = entry.originalSource.startsWith('file://')
        ? fileURLToPath(entry.originalSource)
        : resolve(dirname(script), entry.originalSource);
      line = entry.originalLine;
      name = entry.name || name;
    } else source = script;
  }
  let category = 'runtime / unmapped';
  if (source?.includes('/node_modules/') && /\/immer(?:@|\/)/.test(source))
    category = 'immer';
  else if (source?.startsWith(`${join(root, 'src')}/`)) category = 'mutative';
  else if (source?.startsWith(`${directory}/`)) category = 'workload / harness';
  if (name === '(garbage collector)') category = 'garbage collection';
  const location = source?.startsWith('/')
    ? `${relative(root, source)}:${line + 1}`
    : source || name;
  return {
    name,
    location,
    category,
    key: JSON.stringify([name, location, category]),
  };
}
for (const node of profile.nodes) descriptions.set(node.id, describe(node));

const functions = new Map();
const categories = new Map();
let sampledUs = 0;
for (let i = 0; i < profile.samples.length; i++) {
  let id = profile.samples[i];
  const duration = profile.timeDeltas[i];
  sampledUs += duration;
  const seen = new Set();
  const leaf = descriptions.get(id);
  assert.ok(leaf, `Unknown sampled node ${id}`);
  categories.set(
    leaf.category,
    (categories.get(leaf.category) ?? 0) + duration
  );
  while (id !== undefined) {
    const entry = descriptions.get(id);
    if (!functions.has(entry.key))
      functions.set(entry.key, { ...entry, selfUs: 0, inclusiveUs: 0 });
    const total = functions.get(entry.key);
    if (id === profile.samples[i]) total.selfUs += duration;
    // Recursive appearances of the same function are counted once per sample.
    if (!seen.has(entry.key)) total.inclusiveUs += duration;
    seen.add(entry.key);
    id = parents.get(id);
  }
}
console.log(
  `Profile: ${profilePath}\nSamples: ${profile.samples.length}; sampled time: ${(sampledUs / 1000).toFixed(2)} ms; loaded source maps: ${[...sourceMaps.values()].filter(Boolean).length}`
);
console.log(
  'Exclusive sampled time by source (inclusive function time is not additive):'
);
console.table(
  [...categories]
    .sort((a, b) => b[1] - a[1])
    .map(([source, duration]) => ({
      source,
      selfMs: (duration / 1000).toFixed(2),
      percent: ((100 * duration) / sampledUs).toFixed(2),
    }))
);
console.log('Top 25 functions by exclusive sampled time:');
console.table(
  [...functions.values()]
    .sort((a, b) => b.selfUs - a.selfUs)
    .slice(0, 25)
    .map((entry) => ({
      function: entry.name,
      selfMs: (entry.selfUs / 1000).toFixed(2),
      selfPercent: ((100 * entry.selfUs) / sampledUs).toFixed(2),
      inclusiveMs: (entry.inclusiveUs / 1000).toFixed(2),
      source: entry.location,
    }))
);
