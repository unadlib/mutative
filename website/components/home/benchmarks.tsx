import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { SectionHeading } from './section-heading';

// The results of the performance page in the docs.
const stats = [
  {
    value: '3.6x',
    label: 'Faster than Immer with matched settings',
    detail: 'Faster in 548 of 566 measured cases',
  },
  {
    value: '6.6x',
    label: "Faster than Immer with each library's defaults",
    detail: 'Faster in 142 of 145 measured cases',
  },
  {
    value: '93',
    label: 'Benchmarked workloads',
    detail: 'Every result checked against hand-written reducers',
  },
];

export function Benchmarks() {
  return (
    <section className="border-y bg-fd-card/50">
      <div className="mx-auto w-full max-w-[1100px] px-4 py-20 md:py-28">
        <SectionHeading eyebrow="Fast" title="Faster than Immer, by design">
          Mutative copies each object at most once per update and moves array
          elements natively on its copy, instead of through a draft proxy.
        </SectionHeading>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="relative overflow-hidden rounded-2xl border bg-fd-background p-6 md:p-8"
            >
              <div
                aria-hidden
                className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-fd-primary to-transparent"
              />
              <p className="text-4xl font-semibold tracking-tight md:text-5xl">
                {stat.value}
              </p>
              <p className="mt-3 font-medium">{stat.label}</p>
              <p className="mt-1 text-sm text-fd-muted-foreground">
                {stat.detail}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-fd-muted-foreground">
          Geometric means of Immer&apos;s time over Mutative&apos;s, against
          Immer 11.1.18 on Node.js 24.{' '}
          <Link
            href="/docs/getting-started/performance"
            className="inline-flex items-center gap-1 font-medium text-fd-foreground underline decoration-fd-primary underline-offset-4 transition-opacity hover:opacity-80"
          >
            See the benchmarks
            <ArrowRight className="size-3.5" />
          </Link>
        </p>
      </div>
    </section>
  );
}
