import { ArrowRight, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { SectionHeading } from './section-heading';

// The reports of the "Who Uses Mutative" page in the docs, quoted verbatim.
const projects = [
  {
    name: 'Appsmith',
    url: 'https://github.com/appsmithorg/appsmith',
    description: 'Admin panels, internal tools and dashboards',
    quote:
      'Using mutative instead of immer, this has reduced the main thread scripting by about 1 second.',
    context: 'Replaced Immer with Mutative in its client.',
    source: {
      label: 'Pull request',
      url: 'https://github.com/appsmithorg/appsmith/pull/38993',
      date: 'February 2025',
    },
  },
  {
    name: 'InstantDB',
    url: 'https://github.com/instantdb/instant',
    description: 'A backend with auth, permissions, storage and presence',
    quote: 'Mutative is about 3ms on a single transaction.',
    context:
      'With Immer, a single transaction took about 8 ms, and about 40 ms as pending transactions were added.',
    source: {
      label: 'Pull request',
      url: 'https://github.com/instantdb/instant/pull/243',
      date: 'September 2024',
    },
  },
  {
    name: 'Notesnook',
    url: 'https://github.com/streetwriters/notesnook',
    description: 'An end-to-end encrypted note-taking app',
    quote: "…you'll notice slight improvements in app responsiveness.",
    context: 'Replaced Immer with Mutative in version 3.0.11.',
    source: {
      label: 'Release notes',
      url: 'https://notesnook.com/blog/notesnook-v3.0.11',
      date: 'July 2024',
    },
  },
  {
    name: 'Plate',
    url: 'https://github.com/udecode/plate',
    description: 'A rich-text editor for React',
    quote:
      'All plugin stores now use zustand-mutative for immutable state updates, which is faster than immer.',
    context: 'Moved its plugin stores to zustand-mutative in version 42.',
    source: {
      label: 'Release',
      url: 'https://github.com/udecode/plate/pull/3945',
      date: 'January 2025',
    },
  },
];

const otherProjects = [
  { name: 'Mol*', url: 'https://github.com/molstar/molstar' },
  { name: 'OpenRewrite', url: 'https://github.com/openrewrite/rewrite' },
  { name: 'MSW Data', url: 'https://github.com/mswjs/data' },
];

export function Adopters() {
  return (
    <section className="mx-auto w-full max-w-[1100px] px-4 py-20 md:py-28">
      <SectionHeading eyebrow="In production" title="From Immer to Mutative">
        Open-source projects that replaced Immer with Mutative, in their own
        words.
      </SectionHeading>
      <div className="mt-12 grid gap-4 md:grid-cols-2">
        {projects.map((project) => (
          <figure
            key={project.name}
            className="flex flex-col rounded-2xl border bg-fd-card p-6 md:p-8"
          >
            <blockquote className="flex-1 text-lg font-medium leading-relaxed">
              “{project.quote}”
            </blockquote>
            <p className="mt-3 text-sm text-fd-muted-foreground">
              {project.context}
            </p>
            <figcaption className="mt-6 border-t pt-4">
              <a
                href={project.url}
                target="_blank"
                rel="noreferrer noopener"
                className="font-semibold transition-colors hover:text-fd-primary"
              >
                {project.name}
              </a>
              <p className="text-sm text-fd-muted-foreground">
                {project.description}
              </p>
              <a
                href={project.source.url}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-2 inline-flex items-center gap-1 text-sm text-fd-muted-foreground transition-colors hover:text-fd-foreground"
              >
                {project.source.label}, {project.source.date}
                <ArrowUpRight className="size-3.5" />
              </a>
            </figcaption>
          </figure>
        ))}
      </div>
      <p className="mt-8 text-center text-sm text-fd-muted-foreground">
        Also used by{' '}
        {otherProjects.map((project, index) => (
          <span key={project.name}>
            {index > 0 && (index === otherProjects.length - 1 ? ' and ' : ', ')}
            <a
              href={project.url}
              target="_blank"
              rel="noreferrer noopener"
              className="font-medium text-fd-foreground transition-colors hover:text-fd-primary"
            >
              {project.name}
            </a>
          </span>
        ))}
        .{' '}
        <Link
          href="/docs/extra-topics/who-uses-mutative"
          className="inline-flex items-center gap-1 font-medium text-fd-foreground underline decoration-fd-primary underline-offset-4 transition-opacity hover:opacity-80"
        >
          See who uses Mutative
          <ArrowRight className="size-3.5" />
        </Link>
      </p>
    </section>
  );
}
