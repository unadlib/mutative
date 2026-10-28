import { languageAlternates, localePath, type Locale } from './i18n';
import type { Metadata } from 'next';
import { appName, siteUrl } from './shared';

export const socialImage = '/img/mutative-social-card.jpg';

export const feedTypes = {
  'application/rss+xml': [{ url: '/blog/rss.xml', title: 'Mutative RSS Feed' }],
  'application/atom+xml': [
    { url: '/blog/atom.xml', title: 'Mutative Atom Feed' },
  ],
};

/**
 * Next.js replaces nested metadata objects instead of merging them, so every
 * page that sets `alternates`, `openGraph` or `twitter` starts from these
 * defaults.
 */
export function createMetadata(override: Metadata, locale: Locale = 'en'): Metadata {
  return {
    ...override,
    alternates: {
      types: locale === 'en' ? feedTypes : {
        'application/rss+xml': [{ url: localePath('/blog/rss.xml', locale), title: 'Mutative 中文 RSS 订阅' }],
        'application/atom+xml': [{ url: localePath('/blog/atom.xml', locale), title: 'Mutative 中文 Atom 订阅' }],
      },
      ...(typeof override.alternates?.canonical === 'string' && { languages: languageAlternates(override.alternates.canonical) }),
      ...override.alternates,
    },
    openGraph: {
      siteName: appName,
      type: 'website',
      locale: locale === 'zh' ? 'zh_CN' : 'en_US',
      alternateLocale: locale === 'zh' ? 'en_US' : 'zh_CN',
      images: socialImage,
      title: override.title ?? undefined,
      description: override.description ?? undefined,
      ...override.openGraph,
    },
    twitter: {
      card: 'summary_large_image',
      images: socialImage,
      title: override.title ?? undefined,
      description: override.description ?? undefined,
      ...override.twitter,
    },
  };
}

export const metadataBase = new URL(siteUrl);
