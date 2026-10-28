// Keep translations complete, examples identical, and the static export usable
// in both languages. Run with --source before compilation, without it after.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));
function walk(dir) {
  return fs
    .readdirSync(path.join(root, dir), { withFileTypes: true })
    .flatMap((entry) => {
      const file = `${dir}/${entry.name}`;
      return entry.isDirectory() ? walk(file) : [file];
    });
}
const files = walk('content');
const originals = files.filter((file) => /(?<!\.zh)\.mdx$/.test(file));
const fences = (text) =>
  [...text.matchAll(/^```[^\n]*\n[\s\S]*?^```/gm)].map(([block]) =>
    block.replace(/^[ \t]+$/gm, '')
  );
const inlineCode = (text) =>
  [...text.matchAll(/`([^`\n]+)`/g)].map(([, code]) => code);
const numericCells = (text) =>
  text
    .split('\n')
    .filter((line) => line.startsWith('|'))
    .flatMap((line) => line.split('|').map((cell) => cell.trim()))
    .filter((cell) => /^[\d,.]+(?:%|x|×| µs)?$/.test(cell));

for (const file of originals) {
  const translated = file.replace(/\.mdx$/, '.zh.mdx');
  assert.ok(exists(translated), `Missing Chinese translation: ${file}`);
  const en = read(file);
  const zh = read(translated);
  assert.match(zh, /\p{Script=Han}/u, `Missing Chinese text: ${translated}`);
  assert.deepEqual(
    fences(zh),
    fences(en),
    `Code examples differ: ${translated}`
  );
  assert.deepEqual(
    numericCells(zh),
    numericCells(en),
    `Table figures differ: ${translated}`
  );
  if (file.startsWith('content/blog/')) {
    for (const field of ['date', 'authors', 'tags', 'image']) {
      const value = (text) =>
        text.split('---')[1]?.match(new RegExp(`^${field}: (.*)$`, 'm'))?.[1];
      assert.equal(
        value(zh),
        value(en),
        `Blog ${field} differs: ${translated}`
      );
    }
  }
  const prose = zh.replace(/^```[^\n]*\n[\s\S]*?^```/gm, '');
  assert.doesNotMatch(
    prose,
    /(?:\]\(|href=["'])(?:https:\/\/mutative\.js\.org)?\/(?:docs|blog)(?:[/#)"'])/,
    `Link leaves the Chinese site: ${translated}`
  );
}
for (const file of files.filter((file) => file.endsWith('.zh.mdx'))) {
  assert.ok(
    exists(file.replace('.zh.mdx', '.mdx')),
    `Orphan translation: ${file}`
  );
}
for (const file of files.filter((file) => file.endsWith('/meta.json'))) {
  const translated = file.replace('.json', '.zh.json');
  assert.ok(exists(translated), `Missing Chinese navigation: ${file}`);
  const en = JSON.parse(read(file));
  const zh = JSON.parse(read(translated));
  assert.deepEqual(
    zh.pages,
    en.pages,
    `Navigation order differs: ${translated}`
  );
}
// These exact English messages are what users see in logs, even in Chinese docs.
const diagnosticRows = (text) =>
  text
    .split('\n')
    .filter((line) => line.startsWith('|') && line.includes('`'))
    .map(inlineCode);
assert.deepEqual(
  diagnosticRows(read('content/docs/extra-topics/errors.zh.mdx')),
  diagnosticRows(read('content/docs/extra-topics/errors.mdx')),
  'Chinese error reference must preserve diagnostic messages and identifiers'
);
console.log(
  `Checked ${originals.length} Chinese translations, examples, diagnostics and navigation`
);
if (process.argv.includes('--source')) process.exit(0);

const origin = 'https://mutative.js.org';
const routes = [
  '/',
  '/blog',
  ...originals.map(
    (file) =>
      `/${file.replace(/^content\//, '').replace(/(?:\/index)?\.mdx$/, '')}`
  ),
];
const normalize = (url) =>
  new URL(url, origin).pathname.replace(/\/$/, '') || '/';
const tags = (html, name) =>
  [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'g'))].map(([tag]) =>
    Object.fromEntries(
      [...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(([, key, value]) => [
        key.toLowerCase(),
        value,
      ])
    )
  );
const sitemap = read('out/sitemap.xml');
assert.match(
  read('out/404.html'),
  /返回中文首页/,
  'Static 404 needs Chinese recovery'
);
const search = JSON.parse(read('out/api/search.json'));
assert.equal(search.i18n, true, 'Search must index languages separately');
const documents = Object.values(search.docs.docs);

for (const route of routes) {
  const headings = [];
  for (const locale of ['en', 'zh']) {
    const url = `${locale === 'zh' ? '/zh' : ''}${route === '/' ? '/' : route}`;
    const html = read(`out${url}/index.html`);
    assert.match(
      html,
      new RegExp(`<html[^>]*lang="${locale === 'zh' ? 'zh-CN' : 'en'}"`),
      `Incorrect document language: ${url}`
    );
    const links = tags(html, 'link');
    assert.equal(
      normalize(links.find((link) => link.rel === 'canonical')?.href),
      normalize(url),
      `Incorrect canonical: ${url}`
    );
    for (const [lang, target] of [
      ['en', route],
      ['zh-CN', `/zh${route === '/' ? '/' : route}`],
      ['x-default', route],
    ]) {
      const alternate = links.find((link) => link.hreflang === lang);
      assert.ok(alternate, `Missing ${lang} alternate: ${url}`);
      assert.equal(
        normalize(alternate.href),
        normalize(target),
        `Incorrect ${lang} alternate: ${url}`
      );
    }
    assert.ok(
      sitemap.includes(
        `<loc>${origin}${normalize(url) === '/' ? '' : normalize(url)}/</loc>`
      ),
      `Missing sitemap entry: ${url}`
    );
    headings.push(
      tags(html, 'h[2-6]')
        .map((tag) => tag.id)
        .filter((id) => id && id !== 'toc-title')
    );
    if (route.startsWith('/docs/')) {
      assert.ok(
        documents.some(
          (doc) =>
            doc.type === 'page' &&
            doc.locale === locale &&
            normalize(doc.url) === normalize(url)
        ),
        `Missing search page: ${url}`
      );
      const markdown = read(
        `out${locale === 'zh' ? '/zh' : ''}/llms.mdx${route}/content.md`
      );
      assert.ok(markdown.length > 100, `Empty Markdown: ${url}`);
      if (locale === 'zh') assert.match(markdown, /\p{Script=Han}/u);
    }
  }
  if (route !== '/' && route !== '/blog')
    assert.deepEqual(
      headings[1],
      headings[0],
      `Heading anchors differ: ${route}`
    );
}
for (const doc of documents) {
  assert.equal(
    doc.locale,
    doc.url.startsWith('/zh/') ? 'zh' : 'en',
    `Incorrect search locale: ${doc.url}`
  );
}
for (const locale of ['en', 'zh']) {
  const prefix = locale === 'zh' ? '/zh' : '';
  for (const format of ['rss', 'atom']) {
    const feed = read(`out${prefix}/blog/${format}.xml`);
    for (const route of routes.filter((route) => route.startsWith('/blog/'))) {
      assert.ok(
        feed.includes(`${origin}${prefix}${route}`),
        `Missing ${locale} feed post: ${route}`
      );
    }
    if (locale === 'zh') assert.match(feed, /Mutative 中文博客/);
  }
  const index = read(`out${prefix}/llms.txt`);
  const full = read(`out${prefix}/llms-full.txt`);
  for (const route of routes.filter((route) => route.startsWith('/docs/'))) {
    assert.ok(
      index.includes(`${prefix}/llms.mdx${route}/content.md`),
      `Missing Markdown index entry: ${route}`
    );
    assert.ok(
      full.includes(`(${prefix}${route})`),
      `Missing full Markdown entry: ${route}`
    );
  }
}
console.log(
  `Checked ${routes.length * 2} locale pages, SEO, search, feeds and Markdown exports`
);
