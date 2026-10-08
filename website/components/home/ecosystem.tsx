import { ArrowRight, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { SectionHeading } from './section-heading';

// The libraries of the ecosystem page in the docs.
const libraries = [
  {
    name: 'use-mutative',
    tag: 'React',
    description: 'A 2-6x faster alternative to useState with spread operation.',
    url: 'https://github.com/mutativejs/use-mutative',
  },
  {
    name: 'zustand-mutative',
    tag: 'Zustand',
    description: 'A Mutative middleware for Zustand.',
    url: 'https://github.com/mutativejs/zustand-mutative',
  },
  {
    name: 'jotai-mutative',
    tag: 'Jotai',
    description: 'A Mutative extension for Jotai.',
    url: 'https://github.com/mutativejs/jotai-mutative',
  },
  {
    name: 'xstate-mutative',
    tag: 'XState',
    description: 'Utilities for using Mutative with XState.',
    url: 'https://github.com/mutativejs/xstate-mutative',
  },
  {
    name: 'mutative-yjs',
    tag: 'Yjs',
    description: 'Yjs collaborative web applications built with Mutative.',
    url: 'https://github.com/mutativejs/mutative-yjs',
  },
  {
    name: 'travels',
    tag: 'Undo and redo',
    description:
      'A fast, framework-agnostic undo/redo core powered by Mutative JSON Patch.',
    url: 'https://github.com/mutativejs/travels',
  },
  {
    name: 'use-travel',
    tag: 'React',
    description:
      'A React hook for state time travel with undo, redo, reset and archive.',
    url: 'https://github.com/mutativejs/use-travel',
  },
  {
    name: 'zustand-travel',
    tag: 'Zustand',
    description: 'A high-performance time-travel middleware for Zustand.',
    url: 'https://github.com/mutativejs/zustand-travel',
  },
  {
    name: 'mutative-compat',
    tag: 'Immer API',
    description: 'A Mutative wrapper with full Immer API compatibility.',
    url: 'https://github.com/exuanbo/mutative-compat',
  },
  {
    name: 'reactant',
    tag: 'Framework',
    description: 'A framework for building React applications with Mutative.',
    url: 'https://github.com/unadlib/reactant',
  },
  {
    name: 'usm',
    tag: 'State modules',
    description:
      'A universal state modular library for Redux, MobX, Vuex and Angular.',
    url: 'https://github.com/unadlib/usm',
  },
  {
    name: 'mutability',
    tag: 'Mutable updates',
    description: 'A JavaScript library for transactional mutable updates.',
    url: 'https://github.com/mutativejs/mutability',
  },
];

export function Ecosystem() {
  return (
    <section className="border-y bg-fd-card/50">
      <div className="mx-auto w-full max-w-[1100px] px-4 py-20 md:py-28">
        <SectionHeading eyebrow="Ecosystem" title="Works with your stack">
          Libraries built on Mutative for React, Zustand, Jotai, XState, Yjs and
          more.
        </SectionHeading>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {libraries.map((library) => (
            <a
              key={library.name}
              href={library.url}
              target="_blank"
              rel="noreferrer noopener"
              className="group flex flex-col rounded-2xl border bg-fd-background p-5 transition-colors hover:border-fd-primary/50"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-semibold">
                  {library.name}
                </span>
                <span className="rounded-full border px-2 py-0.5 text-xs text-fd-muted-foreground">
                  {library.tag}
                </span>
                <ArrowUpRight className="ms-auto size-4 text-fd-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-fd-primary" />
              </div>
              <p className="mt-3 text-sm text-fd-muted-foreground">
                {library.description}
              </p>
            </a>
          ))}
        </div>
        <p className="mt-8 text-center text-sm">
          <Link
            href="/docs/extra-topics/mutative-ecosystem"
            className="inline-flex items-center gap-1 font-medium underline decoration-fd-primary underline-offset-4 transition-opacity hover:opacity-80"
          >
            See the ecosystem
            <ArrowRight className="size-3.5" />
          </Link>
        </p>
      </div>
    </section>
  );
}
