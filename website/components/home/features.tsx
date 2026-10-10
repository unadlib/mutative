import {
  Copy,
  FileDiff,
  PencilLine,
  ShieldCheck,
  Snowflake,
  Tags,
  Workflow,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { SectionHeading } from './section-heading';

// The features and benefits of the introduction in the docs.
const features: {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
}[] = [
  {
    icon: PencilLine,
    title: 'Mutation makes immutable updates',
    description:
      'Immutable updates of objects, arrays, Sets and Maps, written as mutations of a draft.',
    href: '/docs/getting-started/usages',
  },
  {
    icon: Zap,
    title: 'High performance',
    description:
      'About 6.7x faster than Immer out of the box, and faster than hand-written spreads for objects with thousands of keys.',
    href: '/docs/getting-started/performance',
  },
  {
    icon: Snowflake,
    title: 'Optional freezing',
    description:
      'No freezing of immutable data by default, and auto-freeze when you want it.',
    href: '/docs/advanced-guides/auto-freeze',
  },
  {
    icon: FileDiff,
    title: 'JSON Patch',
    description:
      'Patches and inverse patches in full compliance with the JSON Patch specification.',
    href: '/docs/advanced-guides/pathes',
  },
  {
    icon: Copy,
    title: 'Custom shallow copy',
    description:
      'Your own shallow copy for more types of immutable data, such as class instances.',
    href: '/docs/advanced-guides/mark',
  },
  {
    icon: Tags,
    title: 'Non-invasive marking',
    description:
      'Mark immutable and mutable data without changing its structure.',
    href: '/docs/advanced-guides/mark',
  },
  {
    icon: ShieldCheck,
    title: 'Strict mode',
    description:
      'Safer access to mutable data, for more secure immutable updates.',
    href: '/docs/advanced-guides/strict-mode',
  },
  {
    icon: Workflow,
    title: 'Reducers',
    description:
      'Producers that work as reducers, with Redux and any other immutable state library.',
    href: '/docs/advanced-guides/currying',
  },
];

export function Features() {
  return (
    <section className="border-y bg-fd-card/50">
      <div className="mx-auto w-full max-w-[1100px] px-4 py-20 md:py-28">
        <SectionHeading
          eyebrow="Features"
          title="Everything immutable updates need"
        >
          Drafts for every data structure, with patches, freezing, marks and
          strict mode when you need them.
        </SectionHeading>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, description, href }) => (
            <Link
              key={title}
              href={href}
              className="group rounded-2xl border bg-fd-background p-6 transition-colors hover:border-fd-primary/50 hover:bg-fd-accent/40"
            >
              <div className="inline-flex size-10 items-center justify-center rounded-xl bg-fd-primary/10 text-fd-primary ring-1 ring-fd-primary/20">
                <Icon className="size-5" />
              </div>
              <h3 className="mt-5 font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-fd-muted-foreground">
                {description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
