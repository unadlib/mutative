# Website

The Mutative website, [mutative.js.org](https://mutative.js.org), is built with [Fumadocs](https://fumadocs.dev) on [Next.js](https://nextjs.org) and exported as a static site for GitHub Pages.

### Installation

```
$ pnpm install
```

### Local Development

```
$ pnpm dev
```

This command starts a local development server at http://localhost:3000. Most changes are reflected live without having to restart the server. From the repository root, `pnpm start:docs` does the same.

### Build

```
$ pnpm build
```

This command exports the static site into the `out` directory. After `next build`, it writes the pages that redirect moved URLs, those of the former Docusaurus site, such as `/docs/category/getting-started/`, and of renamed pages, and fails when a page, the README of the package or a message of the library links to a missing page or anchor of the site. `pnpm start` serves the `out` directory to preview the build.

The build also checks translation coverage and code examples before compilation, then verifies the exported languages, heading anchors, canonical and alternate links, sitemap, search index, feeds and Markdown endpoints.

### Deployment

```
$ pnpm run deploy
```

This command builds the website and pushes the `out` directory to the `gh-pages` branch over SSH, which GitHub Pages serves. From the repository root, `pnpm publish:docs` does the same.

## Content

- `content/docs` holds the docs as MDX files. The `title` and `description` frontmatter fields give the heading and the description of a page; without a description, the first paragraph describes the page in search results and link previews. The `meta.json` file of each folder orders its pages in the sidebar, and its `index.mdx` file is the overview page of the section.
- `content/blog` holds the blog posts, with `title`, `date`, `authors` and `tags` frontmatter fields; the authors are listed in `lib/blog.ts`.
- `lib/benchmarks.ts` holds the benchmark figures of the home page. The tests of the repository check them against `perf-testing/reports/SUMMARY.md`, the README and the performance page, so a new benchmark run updates them together.
- `public` holds the static files, served at the root of the site.
- `static/img/ mutative.png` is the logo of the README, which the READMEs of the published npm packages load from the `main` branch, so it stays at this path.

Pages can use the [components of Fumadocs UI](https://fumadocs.dev/docs/ui/components), such as `<Callout type="warn">`, and code blocks with the `npm` language show an install command for each package manager.

Code blocks that import from `mutative`, and from no other module than `mutative` and `immer`, run as tests of the library in `test/docs.test.ts`, with Vitest's `expect`, so keep them complete; fragments that are not meant to run leave the imports out. The test also checks the table of `content/docs/extra-topics/errors.mdx` against the error messages of the source.

## Languages

English keeps the existing unprefixed URLs; Simplified Chinese lives under `/zh/`. Both languages are statically exported, with their own HTML `lang`, search results, RSS/Atom feeds and Markdown endpoints (`/llms.txt`, `/llms-full.txt` and `/llms.mdx/docs/.../content.md`, prefixed with `/zh` for Chinese). The language selector keeps the current page, query and heading anchor. A missing translation does not silently fall back to English.

- Add a sibling `name.zh.mdx` for every English `name.mdx`, including blog posts. Translate titles, descriptions and prose, while retaining API identifiers, diagnostic messages, benchmark figures and complete code blocks. Keep dates, authors and image references aligned with the original.
- Add `meta.zh.json` beside every `meta.json`. Translate category labels and keep the same page order.
- Preserve English heading IDs explicitly, for example `## 自动冻结 [#auto-freeze]`, so deep links and language switching continue to work. Use `/zh/docs/...` and `/zh/blog/...` for links in Chinese prose; shared images remain at their original paths.
- Shared home and chart copy lives in `lib/messages.ts`; Fumadocs controls are translated in `lib/ui-translations.ts`. Pass the locale through server components and read it from the provider in client components. Never translate property names used for program logic or benchmark data.
- Run `pnpm locales:check` for source-only checks, and `pnpm build` for the complete static export checks. When an English example changes, update its Chinese sibling in the same change. These checks enforce coverage and structural consistency; review translated prose for meaning when the English content changes.

GitHub Pages uses a single root `404.html`; it includes a Chinese recovery link. The Chinese route tree also supplies a localized not-found view for Next.js navigation.
