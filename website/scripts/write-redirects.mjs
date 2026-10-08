// Static exports cannot use Next.js redirects, so this writes a page for each
// URL of the former Docusaurus site that has moved, which sends visitors to
// its new URL.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const siteUrl = 'https://mutative.js.org';
const outDir = fileURLToPath(new URL('../out', import.meta.url));

const redirects = {
  '/docs/': '/docs/intro/',
  '/docs/category/getting-started/': '/docs/getting-started/',
  '/docs/category/advanced-guides/': '/docs/advanced-guides/',
  '/docs/category/api-reference/': '/docs/api-reference/',
  '/docs/category/extra-topics/': '/docs/extra-topics/',
  '/blog/archive/': '/blog/',
  '/blog/tags/': '/blog/',
  '/blog/tags/release/': '/blog/',
};

const page = (to) => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Redirecting to ${to}</title>
    <meta http-equiv="refresh" content="0; url=${to}" />
    <meta name="robots" content="noindex" />
    <link rel="canonical" href="${siteUrl}${to}" />
    <script>
      location.replace(${JSON.stringify(to)} + location.search + location.hash);
    </script>
  </head>
  <body>
    <a href="${to}">${to}</a>
  </body>
</html>
`;

for (const [from, to] of Object.entries(redirects)) {
  const target = path.join(outDir, to, 'index.html');
  if (!fs.existsSync(target)) {
    throw new Error(`The redirect from ${from} goes to a missing page: ${to}`);
  }
  const file = path.join(outDir, from, 'index.html');
  if (fs.existsSync(file)) {
    throw new Error(`The redirect from ${from} would replace a page`);
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, page(to));
}

console.log(`Wrote ${Object.keys(redirects).length} redirects`);
