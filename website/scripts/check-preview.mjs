// Exercise serve's actual handler, including paths that call minimatch directly.
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const serveRequire = createRequire(require.resolve('serve/package.json'));
const handler = serveRequire('serve-handler');
const fixture = await mkdtemp(join(tmpdir(), 'mutative-preview-'));
const config = {
  public: fixture,
  cleanUrls: true,
  headers: [
    {
      source: '**/*.{txt,html}',
      headers: [{ key: 'X-Preview', value: 'matched' }],
    },
  ],
  rewrites: [{ source: '/app/**', destination: '/index.html' }],
  redirects: [{ source: '/legacy/**', destination: '/docs/', type: 302 }],
};
const server = createServer((request, response) => {
  handler(request, response, config).catch((error) => {
    response.statusCode = 500;
    response.end(String(error));
  });
});

try {
  await mkdir(join(fixture, 'zh/docs'), { recursive: true });
  await writeFile(join(fixture, 'index.html'), 'preview home');
  await writeFile(join(fixture, 'zh/docs/index.html'), 'Chinese documentation');
  await writeFile(join(fixture, 'asset.txt'), 'static asset');
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  for (const [path, body] of [
    ['/index.html', 'preview home'],
    ['/zh/docs/', 'Chinese documentation'],
    ['/asset.txt', 'static asset'],
    ['/app/nested/page', 'preview home'],
  ]) {
    const response = await fetch(`${base}${path}`, {
      signal: AbortSignal.timeout(5000),
    });
    assert.equal(response.status, 200, path);
    assert.equal(await response.text(), body, path);
    if (path.endsWith('.txt') || path.endsWith('.html')) {
      assert.equal(response.headers.get('x-preview'), 'matched', path);
    }
  }
  const redirect = await fetch(`${base}/legacy/page`, { redirect: 'manual' });
  assert.equal(redirect.status, 302);
  assert.equal(redirect.headers.get('location'), '/docs/');
  await redirect.arrayBuffer();
  const missing = await fetch(`${base}/missing`);
  assert.equal(missing.status, 404);
  await missing.arrayBuffer();
  console.log(
    'Preview files, localized routes, glob headers, rewrites, redirects, and 404s passed.'
  );
} finally {
  server.closeAllConnections();
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve()))
  );
  await rm(fixture, { recursive: true, force: true });
}
