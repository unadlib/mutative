import { Provider } from '@/components/provider';
import { createMetadata, metadataBase } from '@/lib/metadata';
import { Banner } from 'fumadocs-ui/components/banner';
import type { Metadata } from 'next';
import Link from 'next/link';
import './global.css';

export const metadata: Metadata = {
  metadataBase,
  icons: '/img/favicon.ico',
  ...createMetadata({
    title: {
      default:
        'Mutative - A JavaScript library for efficient immutable updates',
      template: '%s | Mutative',
    },
    description:
      "Efficient immutable updates, about 3.6x faster than Immer with matched settings and 6.7x faster with each library's defaults.",
  }),
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <Banner id="announcement-v1">
          {/* One flex item, so that the spaces between its parts stay. */}
          <span>
            🎉️{' '}
            <b>
              <Link href="/blog/releases/1.0" className="underline">
                Mutative v1.0
              </Link>{' '}
              is now out!
            </b>{' '}
            🥳️
          </span>
        </Banner>
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
