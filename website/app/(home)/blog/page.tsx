import { formatDate, getPosts, getReadingTime } from '@/lib/blog';
import { createMetadata } from '@/lib/metadata';
import { getPageDescription } from '@/lib/source';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = createMetadata({
  title: 'Blog',
  description: 'Mutative Blog',
  alternates: {
    canonical: '/blog',
  },
  openGraph: {
    url: '/blog',
  },
});

export default async function Page() {
  const posts = await Promise.all(
    getPosts().map(async (post) => ({
      post,
      readingTime: await getReadingTime(post),
    }))
  );

  return (
    <div className="mx-auto w-full max-w-[860px] flex-1 px-4 py-12 md:py-16">
      <h1 className="mb-8 text-3xl font-bold md:text-4xl">Blog</h1>
      <div className="flex flex-col gap-4">
        {posts.map(({ post, readingTime }) => (
          <Link
            key={post.url}
            href={post.url}
            className="rounded-xl border bg-fd-card p-6 transition-colors hover:bg-fd-accent"
          >
            <p className="text-sm text-fd-muted-foreground">
              <time dateTime={post.data.date.toISOString()}>
                {formatDate(post.data.date)}
              </time>{' '}
              · {readingTime} min read
            </p>
            <h2 className="mt-2 text-xl font-semibold">{post.data.title}</h2>
            <p className="mt-2 text-fd-muted-foreground">
              {getPageDescription(post.data)}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
