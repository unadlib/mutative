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

This command exports the static site into the `out` directory. After `next build`, it writes the pages that redirect the URLs of the former Docusaurus site, such as `/docs/category/getting-started/`, and fails when a page links to a missing page or anchor. `pnpm start` serves the `out` directory to preview the build.

### Deployment

```
$ pnpm run deploy
```

This command builds the website and pushes the `out` directory to the `gh-pages` branch over SSH, which GitHub Pages serves. From the repository root, `pnpm publish:docs` does the same.

## Content

- `content/docs` holds the docs as MDX files. The `title` and `description` frontmatter fields give the heading and the description of a page; without a description, the first paragraph describes the page in search results and link previews. The `meta.json` file of each folder orders its pages in the sidebar, and its `index.mdx` file is the overview page of the section.
- `content/blog` holds the blog posts, with `title`, `date`, `authors` and `tags` frontmatter fields; the authors are listed in `lib/blog.ts`.
- `public` holds the static files, served at the root of the site.
- `static/img/ mutative.png` is the logo of the README, which the READMEs of the published npm packages load from the `main` branch, so it stays at this path.

Pages can use the [components of Fumadocs UI](https://fumadocs.dev/docs/ui/components), such as `<Callout type="warn">`, and code blocks with the `npm` language show an install command for each package manager.
