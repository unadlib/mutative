import { createGetUrl } from 'fumadocs-core/source';

export const appName = 'Mutative';
export const siteUrl = 'https://mutative.js.org';
export const docsRoute = '/docs';
export const docsContentRoute = '/llms.mdx/docs';

export const gitConfig = {
  user: 'unadlib',
  repo: 'mutative',
  branch: 'main',
};

export const githubUrl = `https://github.com/${gitConfig.user}/${gitConfig.repo}`;

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

const getContentUrl = createGetUrl(docsContentRoute);

/**
 * The URL of the Markdown of a docs page, a static file at
 * `/llms.mdx/docs/<slugs>/content.md`.
 */
export function getPageMarkdownUrl(page: { slugs: string[]; locale?: string }) {
  const segments = [...page.slugs, 'content.md'];

  return { segments, url: getContentUrl(segments, page.locale) };
}
