import { loader } from 'fumadocs-core/source';
import { pageSchema } from 'fumadocs-core/source/schema';
import { defineCollections } from 'fumadocs-mdx/macro';
import { z } from 'zod';

const posts = defineCollections({
  type: 'doc',
  dir: 'content/blog',
  schema: pageSchema.extend({
    authors: z
      .union([z.string(), z.array(z.string())])
      .transform((value) => (typeof value === 'string' ? [value] : value)),
    tags: z.array(z.string()).default([]),
    image: z.string().optional(),
    date: z.coerce.date(),
  }),
});

export const blog = loader({
  baseUrl: '/blog',
  source: posts.toFumadocsSource(),
});

export type BlogPost = ReturnType<typeof blog.getPages>[number];

export interface Author {
  name: string;
  title: string;
  url: string;
  imageUrl: string;
}

export const authors: Record<string, Author> = {
  unadlib: {
    name: 'Michael Lin',
    title: 'Author of Mutative',
    url: 'https://unadlib.github.io',
    imageUrl: 'https://github.com/unadlib.png',
  },
};

/**
 * The posts, newest first.
 */
export function getPosts(): BlogPost[] {
  return blog
    .getPages()
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export function getAuthors(post: BlogPost): Author[] {
  return post.data.authors.map((key) => {
    const author = authors[key];
    if (!author) throw new Error(`Unknown author "${key}" in ${post.path}`);
    return author;
  });
}

/**
 * Minutes to read a post at 200 words per minute, as Docusaurus estimated.
 */
export async function getReadingTime(post: BlogPost): Promise<number> {
  const content = (await post.data.getText('raw')).replace(
    /^---\n[\s\S]*?\n---\n/,
    ''
  );
  const words = content.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}
