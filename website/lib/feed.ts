import { localePath, type Locale } from './i18n';
import { Feed } from 'feed';
import { getAuthors, getPosts } from './blog';
import { siteUrl } from './shared';
import { getPageDescription } from './source';

/**
 * The blog feed. Like the Docusaurus feed, each post is identified by its link,
 * so that feed readers keep the posts they have seen, and only Atom names the
 * authors: an RSS `<author>` must be an email address.
 */
export function getFeed(format: 'rss' | 'atom', locale: Locale = 'en'): string {
  const posts = getPosts(locale);
  const feed = new Feed({
    id: `${siteUrl}${localePath('/blog', locale)}`,
    title: locale === 'zh' ? 'Mutative 中文博客' : 'Mutative Blog',
    description: locale === 'zh' ? 'Mutative 中文博客' : 'Mutative Blog',
    link: `${siteUrl}${localePath('/blog', locale)}`,
    language: locale === 'zh' ? 'zh-CN' : 'en',
    favicon: `${siteUrl}/img/favicon.ico`,
    updated: posts[0]?.data.date,
    feedLinks: {
      rss: `${siteUrl}${localePath('/blog/rss.xml', locale)}`,
      atom: `${siteUrl}${localePath('/blog/atom.xml', locale)}`,
    },
  });

  for (const post of posts) {
    feed.addItem({
      title: post.data.title,
      link: `${siteUrl}${post.url}`,
      date: post.data.date,
      description: getPageDescription(post.data),
      author:
        format === 'atom'
          ? getAuthors(post).map((author) => ({
              name: author.name,
              link: author.url,
            }))
          : undefined,
      category: post.data.tags.map((tag) => ({
        name: locale === 'zh' && tag === 'release' ? '版本发布' : tag,
        term: tag,
      })),
    });
  }

  return format === 'rss' ? feed.rss2() : feed.atom1();
}
