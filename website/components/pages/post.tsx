import { type Locale, localePath } from '@/lib/i18n';
import { getMDXComponents } from '@/components/mdx';
import { blog, getAuthors, getReadingTime } from '@/lib/blog';
import { createMetadata } from '@/lib/metadata';
import { formatDate, gitConfig, githubUrl } from '@/lib/shared';
import { getPageDescription } from '@/lib/source';
import { InlineTOC } from 'fumadocs-ui/components/inline-toc';
import { EditOnGitHub } from 'fumadocs-ui/layouts/docs/page';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export async function BlogPostContent({
  slug,
  locale = 'en',
}: {
  slug: string[];
  locale?: Locale;
}) {
  const post = blog.getPage(slug, locale);
  if (!post) notFound();

  const MDX = post.data.body;
  const readingTime = await getReadingTime(post);

  return (
    <div className="mx-auto w-full max-w-[860px] flex-1 px-4 py-12 md:py-16">
      <Link
        href={localePath('/blog', locale)}
        className="text-sm text-fd-muted-foreground transition-colors hover:text-fd-foreground"
      >
        ← {locale === 'zh' ? '博客' : 'Blog'}
      </Link>
      <h1 className="mt-4 text-3xl font-bold md:text-4xl">{post.data.title}</h1>
      <p className="mt-3 text-sm text-fd-muted-foreground">
        <time dateTime={post.data.date.toISOString()}>
          {formatDate(post.data.date, locale)}
        </time>{' '}
        · {readingTime} {locale === 'zh' ? '分钟阅读' : 'min read'}
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
                {locale === 'zh' ? 'Mutative 作者' : author.title}
              </span>
            </span>
          </a>
        ))}
      </div>
      <InlineTOC items={post.data.toc} className="mt-8" />
      <article className="prose mt-8 min-w-0">
        <MDX components={getMDXComponents()} />
      </article>
      <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t pt-6">
        {post.data.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium">
              {locale === 'zh' ? '标签：' : 'Tags:'}
            </span>
            {post.data.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border bg-fd-secondary px-3 py-0.5 text-fd-secondary-foreground"
              >
                {locale === 'zh' && tag === 'release' ? '版本发布' : tag}
              </span>
            ))}
          </div>
        )}
        <EditOnGitHub
          href={`${githubUrl}/blob/${gitConfig.branch}/website/content/blog/${post.path}`}
          className="ms-auto"
        />
      </div>
    </div>
  );
}

export async function postMetadata(
  slug: string[],
  locale: Locale = 'en'
): Promise<Metadata> {
  const post = blog.getPage(slug, locale);
  if (!post) notFound();

  // Next.js leaves out the trailing slash of a URL that looks like a file, such
  // as `/blog/releases/1.0`, but GitHub Pages serves it at `/blog/releases/1.0/`.
  const url = `${post.url}/`;

  return createMetadata(
    {
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
    },
    locale
  );
}
