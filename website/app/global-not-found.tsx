import type { Metadata } from 'next';
import Link from 'next/link';
import './global.css';

export const metadata: Metadata = {
  title: 'Page Not Found / 页面未找到 | Mutative',
  robots: { index: false, follow: false },
};

// GitHub Pages serves one 404.html for both route trees. Keep both recovery
// paths available without JavaScript or a language preference cookie.
export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-fd-background px-6 text-fd-foreground">
        <main className="max-w-lg space-y-8 py-16 text-center">
          <p className="text-lg font-semibold">Mutative</p>
          <h1 className="text-7xl font-bold text-fd-muted-foreground">404</h1>
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">Page Not Found</h2>
            <p className="text-fd-muted-foreground">
              This page may have been removed, renamed or be temporarily
              unavailable.
            </p>
            <Link
              href="/"
              className="inline-block underline underline-offset-4"
            >
              Back to English home
            </Link>
          </section>
          <section lang="zh-CN" className="space-y-3 border-t pt-8">
            <h2 className="text-2xl font-semibold">页面未找到</h2>
            <p className="text-fd-muted-foreground">
              此页面可能已被删除、改名或暂时无法访问。
            </p>
            <Link
              href="/zh/"
              className="inline-block underline underline-offset-4"
            >
              返回中文首页
            </Link>
          </section>
        </main>
      </body>
    </html>
  );
}
