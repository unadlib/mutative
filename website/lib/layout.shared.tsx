import { localePath, type Locale } from './i18n';
import type { BaseLayoutProps, LinkItemType } from 'fumadocs-ui/layouts/shared';
import Image from 'next/image';
import { appName, githubUrl } from './shared';

export function baseOptions(locale: Locale = 'en'): BaseLayoutProps {
  return {
    i18n: true,
    nav: {
      url: localePath('/', locale),
      title: (
        <>
          <Image
            src="/img/logo.svg"
            alt=""
            width={24}
            height={24}
            loading="eager"
          />
          {appName}
        </>
      ),
    },
    githubUrl,
  };
}

/**
 * The release notes, on GitHub.
 */
export const releasesLink = (locale: Locale = 'en'): LinkItemType => ({
  text: locale === 'zh' ? '版本发布' : 'Releases',
  url: `${githubUrl}/releases`,
  external: true,
});

/**
 * The navbar links of the pages outside the docs.
 */
export const homeLinks = (locale: Locale = 'en'): LinkItemType[] => [
  {
    text: locale === 'zh' ? '文档' : 'Docs',
    url: localePath('/docs/intro', locale),
  },
  {
    text: locale === 'zh' ? '博客' : 'Blog',
    url: localePath('/blog', locale),
    active: 'nested-url',
  },
  releasesLink(locale),
];
