import { defineI18n } from 'fumadocs-core/i18n';

export type Locale = 'en' | 'zh';
export const locales: Locale[] = ['en', 'zh'];
export const i18n = defineI18n({
  languages: locales,
  defaultLanguage: 'en',
  hideLocale: 'default-locale',
  fallbackLanguage: null,
});

export function localePath(path: string, locale: Locale): string {
  if (!path.startsWith('/') || path.startsWith('//')) return path;
  const bare = path.replace(/^\/zh(?=\/|$)/, '') || '/';
  return locale === 'zh' ? `/zh${bare === '/' ? '/' : bare}` : bare;
}

export function languageAlternates(path: string) {
  return {
    en: localePath(path, 'en'),
    'zh-CN': localePath(path, 'zh'),
    'x-default': localePath(path, 'en'),
  };
}
