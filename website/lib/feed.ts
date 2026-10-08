import { Feed } from 'feed';
import { getAuthors, getPosts } from './blog';
import { siteUrl } from './shared';
import { getPageDescription } from './source';

/**
 * The blog feed. Like the Docusaurus feed, each post is identified by its link,
 * so that feed readers keep the posts they have seen, and only Atom names the
 * authors: an RSS `<author>` must be an email address.
 */
export function getFeed(format: 'rss' | 'atom'): string {
  const posts = getPosts();
  const feed = new Feed({
    id: `${siteUrl}/blog`,
    title: 'Mutative Blog',
    description: 'Mutative Blog',
    link: `${siteUrl}/blog`,
    language: 'en',
    favicon: `${siteUrl}/img/favicon.ico`,
    updated: posts[0]?.data.date,
    feedLinks: {
      rss: `${siteUrl}/blog/rss.xml`,
      atom: `${siteUrl}/blog/atom.xml`,
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
      category: post.data.tags.map((tag) => ({ name: tag, term: tag })),
    });
  }

  return format === 'rss' ? feed.rss2() : feed.atom1();
}
