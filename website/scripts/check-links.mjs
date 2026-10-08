// Fails the build when a page links to a page or an anchor that the static
// export lacks, as the Docusaurus build did with `onBrokenLinks: 'throw'`.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const siteUrl = 'https://mutative.js.org';
const outDir = fileURLToPath(new URL('../out', import.meta.url));

const decode = (text) =>
  text
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

function getHtmlFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) return getHtmlFiles(file);
    return entry.name.endsWith('.html') ? [file] : [];
  });
}

const ids = new Map();
function getIds(file) {
  if (!ids.has(file)) {
    const html = fs.readFileSync(file, 'utf8');
    ids.set(
      file,
      new Set(
        [...html.matchAll(/\sid="([^"]*)"/g)].map((match) => decode(match[1]))
      )
    );
  }
  return ids.get(file);
}

// Resolves a URL path as GitHub Pages serves it.
function resolve(pathname) {
  const target = path.join(outDir, pathname);
  const candidates = pathname.endsWith('/')
    ? [path.join(target, 'index.html')]
    : [target, path.join(target, 'index.html'), `${target}.html`];
  return candidates.find(
    (file) => fs.existsSync(file) && fs.statSync(file).isFile()
  );
}

const broken = [];
const files = getHtmlFiles(outDir);
for (const file of files) {
  const page = `/${path.relative(outDir, file).replace(/index\.html$/, '')}`;
  const html = fs.readFileSync(file, 'utf8');
  for (const [, href] of html.matchAll(/<a\s[^>]*?href="([^"]*)"/g)) {
    const url = new URL(decode(href), siteUrl + page);
    if (url.origin !== siteUrl) continue;
    const target = resolve(decodeURIComponent(url.pathname));
    if (!target) {
      broken.push(`${page}: ${href} (missing page)`);
    } else if (
      url.hash.length > 1 &&
      target.endsWith('.html') &&
      !getIds(target).has(decodeURIComponent(url.hash.slice(1)))
    ) {
      broken.push(`${page}: ${href} (missing anchor)`);
    }
  }
}

if (broken.length > 0) {
  console.error(`Found ${broken.length} broken links:\n${broken.join('\n')}`);
  process.exit(1);
}
console.log(`Checked the links of ${files.length} pages`);
