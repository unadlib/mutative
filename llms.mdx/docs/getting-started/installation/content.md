# Installation (/docs/getting-started/installation)

Install Mutative from npm or load it from a CDN, and check the environments it supports.

## Package managers [#package-managers]



```bash
npm install mutative
```

```bash
pnpm add mutative
```

```bash
yarn add mutative
```

```bash
bun add mutative
```

Mutative has no dependencies. A production bundle of `create` alone is about 7.9 kB after Brotli compression, and one of `create`, `apply`, `current` and `original` about 8.5 kB, including patches, `Map` and `Set` support and native array methods, which need no plugins.

```ts
import { create } from 'mutative';
```

## Requirements [#requirements]

* **JavaScript.** Mutative needs `Proxy` and the ES2018 syntax that its builds keep, such as object spread: Node.js 14.0 or later, current browsers, and React Native 0.64 or later. Engines that support `Proxy` but not ES2018 syntax, such as Chrome 49–59, Firefox 18–54, Safari 10–11.0 and Edge 12–18, need Mutative transpiled by your build. Internet Explorer has no `Proxy` and is not supported.
* **TypeScript.** The type declarations support TypeScript 5.0 and later; see [TypeScript](/docs/advanced-guides/typescript).

## Development and production builds [#development-and-production-builds]

The package holds a development build, with full error messages, warnings and extra checks, and a minified production build, whose errors are [numeric codes](/docs/extra-topics/errors). Which one runs depends on `process.env.NODE_ENV`:

* **Bundlers** resolve the ESM build, whose development checks compare `process.env.NODE_ENV` with `'production'`. Bundlers that define it as `'production'`, as webpack, Vite, Rollup and esbuild setups for production usually do, drop the development code. Bundles that target Node.js resolve the CommonJS entry instead; define `process.env.NODE_ENV` there, or leave Mutative external.
* **Node.js** runs the CommonJS build for `require` and `import` alike, and selects the development or production build from `NODE_ENV` when it loads Mutative.
* **Browsers without a bundler** have no `process`, so they need the production ESM file or the UMD build below.

## CDN [#cdn]

* Unpkg: `<script src="https://unpkg.com/mutative"></script>`
* JSDelivr: `<script src="https://cdn.jsdelivr.net/npm/mutative"></script>`
* ES module: `import { create } from 'https://unpkg.com/mutative/dist/mutative.esm.production.min.mjs';`

The `<script>` tags load the production UMD build, which defines a global `Mutative`, as in `Mutative.create(baseState, recipe)`. The package's other ESM files read `process.env.NODE_ENV`, which bundlers and Node.js provide; a browser without a bundler needs the production file above.

```html
<script type="module">
  import { create } from 'https://unpkg.com/mutative/dist/mutative.esm.production.min.mjs';

  const state = create({ count: 0 }, (draft) => {
    draft.count += 1;
  });
  console.log(state.count); // 1
</script>
```
