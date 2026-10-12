import { Provider } from '@/components/provider';
import { speedups } from '@/lib/benchmarks';
import { createMetadata, metadataBase } from '@/lib/metadata';
import type { Metadata } from 'next';
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
    description: `Efficient immutable updates, about ${speedups.matched.factor}x faster than Immer with matched settings and ${speedups.defaults.factor}x faster with each library's defaults.`,
  }),
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
