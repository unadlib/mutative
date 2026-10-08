import { getMDXComponents } from '@/components/mdx';
import { getLastUpdate } from '@/lib/git';
import { createMetadata } from '@/lib/metadata';
import { formatDate, gitConfig, githubUrl } from '@/lib/shared';
import { getPageDescription, source } from '@/lib/source';
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  EditOnGitHub,
} from 'fumadocs-ui/layouts/docs/page';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export default async function Page(props: PageProps<'/docs/[[...slug]]'>) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;
  const file = `content/docs/${page.path}`;
  const lastUpdate = getLastUpdate(file);

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDX
          components={getMDXComponents({
            // this allows you to link to other pages with relative file paths
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>
      <div className="flex flex-row flex-wrap items-center justify-between gap-4">
        <EditOnGitHub
          href={`${githubUrl}/blob/${gitConfig.branch}/website/${file}`}
        />
        {lastUpdate && (
          <p className="text-sm text-fd-muted-foreground">
            Last updated on{' '}
            <time dateTime={lastUpdate.date.toISOString()}>
              {formatDate(lastUpdate.date)}
            </time>{' '}
            by {lastUpdate.author}
          </p>
        )}
      </div>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(
  props: PageProps<'/docs/[[...slug]]'>
): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  return createMetadata({
    title: page.data.title,
    description: getPageDescription(page.data),
    alternates: {
      canonical: page.url,
    },
    openGraph: {
      url: page.url,
    },
  });
}
