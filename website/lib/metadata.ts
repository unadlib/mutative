import type { Metadata } from 'next';
import { appName, siteUrl } from './shared';

export const socialImage = '/img/mutative-social-card.jpg';

/**
 * Next.js replaces nested metadata objects instead of merging them, so every
 * page that sets `openGraph` or `twitter` starts from these defaults.
 */
export function createMetadata(override: Metadata): Metadata {
  return {
    ...override,
    openGraph: {
      siteName: appName,
      type: 'website',
      locale: 'en',
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
