import { githubUrl } from '@/lib/shared';
import Link from 'next/link';

const columns = [
  {
    title: 'Docs',
    links: [{ text: 'Introduction', href: '/docs/intro' }],
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
    ],
  },
];

export function Footer() {
  return (
    // The footer keeps the dark palette in both color modes.
    <footer className="dark bg-[#303846] px-4 py-12 text-fd-foreground">
      <div className="mx-auto grid max-w-[1140px] gap-8 sm:grid-cols-3">
        {columns.map((column) => (
          <div key={column.title}>
            <p className="mb-3 font-semibold">{column.title}</p>
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
      <p className="mt-10 text-center text-sm text-fd-muted-foreground">
        Copyright © {new Date().getFullYear()} Mutative, Inc.
      </p>
    </footer>
  );
}
