'use client';
import { zhUI } from '@/lib/ui-translations';
import { i18n, type Locale } from '@/lib/i18n';
import SearchDialog from '@/components/search';
import { RootProvider } from 'fumadocs-ui/provider/next';
import type { ReactNode } from 'react';

export function Provider({
  children,
  locale = 'en',
}: {
  children: ReactNode;
  locale?: Locale;
}) {
  return (
    <RootProvider
      i18n={{
        defaultLanguage: i18n.defaultLanguage,
        hideLocale: i18n.hideLocale,
        locale,
        translations: locale === 'zh' ? zhUI : undefined,
        onLocaleChange: (next) => {
          const path =
            window.location.pathname.replace(/^\/zh(?=\/|$)/, '') || '/';
          window.location.assign(
            `${next === 'zh' ? '/zh' : ''}${path}${window.location.search}${window.location.hash}`
          );
        },
        locales: [
          { locale: 'en', name: 'English' },
          { locale: 'zh', name: '简体中文' },
        ],
      }}
      search={{ SearchDialog }}
    >
      {children}
    </RootProvider>
  );
}
