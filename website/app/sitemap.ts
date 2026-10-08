import { blog } from '@/lib/blog';
import { getLastUpdate } from '@/lib/git';
import { siteUrl } from '@/lib/shared';
import { source } from '@/lib/source';
import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

// With a trailing slash, as GitHub Pages serves each page.
function getUrl(path: string): string {
  return `${siteUrl}${path === '/' ? '' : path}/`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = [
    { url: getUrl('/') },
    { url: getUrl('/blog') },
    ...blog.getPages().map((post) => ({
      url: getUrl(post.url),
      lastModified: getLastUpdate(`content/blog/${post.path}`)?.date,
    })),
    ...source.getPages().map((page) => ({
      url: getUrl(page.url),
      lastModified: getLastUpdate(`content/docs/${page.path}`)?.date,
    })),
  ];
  // As in the Docusaurus sitemap.
  return pages.map((page) => ({
    changeFrequency: 'weekly',
    priority: 0.5,
    ...page,
  }));
}
