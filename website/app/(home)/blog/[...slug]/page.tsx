import { getMDXComponents } from '@/components/mdx';
import { blog, formatDate, getAuthors, getReadingTime } from '@/lib/blog';
import { createMetadata } from '@/lib/metadata';
import { getPageDescription } from '@/lib/source';
import { InlineTOC } from 'fumadocs-ui/components/inline-toc';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function Page(props: PageProps<'/blog/[...slug]'>) {
  const { slug } = await props.params;
  const post = blog.getPage(slug);
  if (!post) notFound();

  const MDX = post.data.body;
  const readingTime = await getReadingTime(post);

  return (
    <div className="mx-auto w-full max-w-[860px] flex-1 px-4 py-12 md:py-16">
      <Link
        href="/blog"
        className="text-sm text-fd-muted-foreground transition-colors hover:text-fd-foreground"
      >
        ← Blog
      </Link>
      <h1 className="mt-4 text-3xl font-bold md:text-4xl">{post.data.title}</h1>
      <p className="mt-3 text-sm text-fd-muted-foreground">
        <time dateTime={post.data.date.toISOString()}>
          {formatDate(post.data.date)}
        </time>{' '}
        · {readingTime} min read
      </p>
      <div className="mt-6 flex flex-wrap gap-6">
        {getAuthors(post).map((author) => (
          <a
            key={author.name}
            href={author.url}
            target="_blank"
            rel="noreferrer noopener"
            className="flex items-center gap-3"
          >
            <Image
              src={author.imageUrl}
              alt=""
              width={40}
              height={40}
              className="size-10 rounded-full"
            />
            <span>
              <span className="block font-medium">{author.name}</span>
              <span className="block text-sm text-fd-muted-foreground">
                {author.title}
              </span>
            </span>
          </a>
        ))}
      </div>
      <InlineTOC items={post.data.toc} className="mt-8" />
      <article className="prose mt-8 min-w-0">
        <MDX components={getMDXComponents()} />
      </article>
      {post.data.tags.length > 0 && (
        <div className="mt-10 flex flex-wrap items-center gap-2 border-t pt-6 text-sm">
          <span className="font-medium">Tags:</span>
          {post.data.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border bg-fd-secondary px-3 py-0.5 text-fd-secondary-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function generateStaticParams() {
  return blog.generateParams();
}

export async function generateMetadata(
  props: PageProps<'/blog/[...slug]'>
): Promise<Metadata> {
  const { slug } = await props.params;
  const post = blog.getPage(slug);
  if (!post) notFound();

  // Next.js leaves out the trailing slash of a URL that looks like a file, such
  // as `/blog/releases/1.0`, but GitHub Pages serves it at `/blog/releases/1.0/`.
  const url = `${post.url}/`;

  return createMetadata({
    title: post.data.title,
    description: getPageDescription(post.data),
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: 'article',
      url,
      publishedTime: post.data.date.toISOString(),
      authors: getAuthors(post).map((author) => author.name),
      tags: post.data.tags,
      ...(post.data.image && { images: post.data.image }),
    },
    twitter: {
      ...(post.data.image && { images: post.data.image }),
    },
  });
}
