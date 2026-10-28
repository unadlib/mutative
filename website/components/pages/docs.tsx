import { type Locale, localePath } from '@/lib/i18n';
import { DocsCategory } from '@/components/docs-category';
import { getMDXComponents } from '@/components/mdx';
import { getLastUpdate } from '@/lib/git';
import { createMetadata } from '@/lib/metadata';
import {
  formatDate,
  getPageMarkdownUrl,
  gitConfig,
  githubUrl,
} from '@/lib/shared';
import { getPageDescription, source } from '@/lib/source';
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  EditOnGitHub,
  MarkdownCopyButton,
  ViewOptionsPopover,
} from 'fumadocs-ui/layouts/docs/page';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export async function DocsContent({ slug, locale = 'en' }: { slug?: string[]; locale?: Locale }) {
  const page = source.getPage(slug, locale);
  if (!page) notFound();

  const MDX = page.data.body;
  const file = `content/docs/${page.path}`;
  const lastUpdate = getLastUpdate(file);
  const githubFileUrl = `${githubUrl}/blob/${gitConfig.branch}/website/${file}`;
  const markdownUrl = getPageMarkdownUrl(page).url;

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription className="mb-0">
        {page.data.description}
      </DocsDescription>
      <div className="flex flex-row items-center gap-2 border-b pb-6">
        <MarkdownCopyButton markdownUrl={markdownUrl} />
        <ViewOptionsPopover
          markdownUrl={markdownUrl}
          githubUrl={githubFileUrl}
        />
      </div>
      <DocsBody>
        <MDX
          components={getMDXComponents({
            // this allows you to link to other pages with relative file paths
            a: createRelativeLink(source, page),
            DocsCategory: () => <DocsCategory url={page.url} locale={locale} />,
          })}
        />
      </DocsBody>
      <div className="flex flex-row flex-wrap items-center justify-between gap-4">
        <EditOnGitHub href={githubFileUrl} />
        {lastUpdate && (
          <p className="text-sm text-fd-muted-foreground">
            {locale === 'zh' ? '最后更新于' : 'Last updated on'}{' '}
            <time dateTime={lastUpdate.date.toISOString()}>
              {formatDate(lastUpdate.date, locale)}
            </time>{' '}
            {locale === 'zh' ? '作者：' : 'by '}{lastUpdate.author}
          </p>
        )}
      </div>
    </DocsPage>
  );
}

export async function docsMetadata(slug: string[] | undefined, locale: Locale = 'en'): Promise<Metadata> {
  const page = source.getPage(slug, locale);
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
  }, locale);
}
