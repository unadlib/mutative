import { appName, githubUrl } from '@/lib/shared';
import Image from 'next/image';
import Link from 'next/link';

const columns = [
  {
    title: 'Docs',
    links: [
      { text: 'Introduction', href: '/docs/intro' },
      { text: 'Getting Started', href: '/docs/getting-started' },
      { text: 'API Reference', href: '/docs/api-reference' },
      { text: 'Performance', href: '/docs/getting-started/performance' },
    ],
  },
  {
    title: 'Community',
    links: [
      {
        text: 'Stack Overflow',
        href: 'https://stackoverflow.com/questions/tagged/mutative',
      },
      { text: 'Discord', href: 'https://discord.gg/vC9Uy3rEfA' },
      { text: 'Twitter', href: 'https://twitter.com/unadlib' },
    ],
  },
  {
    title: 'More',
    links: [
      { text: 'Blog', href: '/blog' },
      { text: 'GitHub', href: githubUrl },
      { text: 'npm', href: 'https://www.npmjs.com/package/mutative' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t bg-fd-card/50">
      <div className="mx-auto grid max-w-[1100px] gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-lg font-semibold"
          >
            <Image src="/img/logo.svg" alt="" width={28} height={28} />
            {appName}
          </Link>
          <p className="mt-3 max-w-[280px] text-sm text-fd-muted-foreground">
            A JavaScript library for efficient immutable updates.
          </p>
        </div>
        {columns.map((column) => (
          <div key={column.title}>
            <p className="mb-3 text-sm font-semibold">{column.title}</p>
            <ul className="space-y-2 text-sm text-fd-muted-foreground">
              {column.links.map((link) => (
                <li key={link.text}>
                  {link.href.startsWith('/') ? (
                    <Link
                      href={link.href}
                      className="transition-colors hover:text-fd-primary"
                    >
                      {link.text}
                    </Link>
                  ) : (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="transition-colors hover:text-fd-primary"
                    >
                      {link.text}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t">
        <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-2 px-4 py-6 text-sm text-fd-muted-foreground">
          <p>Copyright © {new Date().getFullYear()} Mutative, Inc.</p>
          <p>Released under the MIT License.</p>
        </div>
      </div>
    </footer>
  );
}
