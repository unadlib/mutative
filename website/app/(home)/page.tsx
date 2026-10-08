import { Benchmarks } from '@/components/home/benchmarks';
import { CodeComparison } from '@/components/home/code-comparison';
import { Hero } from '@/components/home/hero';
import { feedTypes } from '@/lib/metadata';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
    types: feedTypes,
  },
};

const features: { title: string; description: ReactNode }[] = [
  {
    title: 'Simplifies Immutable Updates',
    description: (
      <>
        Writing immutable updates by hand is usually difficult, prone to errors,
        and cumbersome. Mutative helps us write simpler immutable updates with{' '}
        <code>mutative</code> logic.
      </>
    ),
  },
  {
    title: 'High Performance',
    description: (
      <>
        Mutative is about 3.4x faster than Immer with matched settings, and 6x
        faster when both use their default settings.
      </>
    ),
  },
  {
    title: 'Powerful',
    description: (
      <>
        Mutative supports custom shallow copying. It enables the custom marking
        of mutable and immutable data. It also supports JSON patches
        specification, strict mode, Reducers, and more.
      </>
    ),
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col">
      <Hero />
      <CodeComparison />
      <Benchmarks />
      <section className="mx-auto grid w-full max-w-[1140px] gap-10 px-4 py-16 md:grid-cols-3">
        {features.map(({ title, description }) => (
          <div key={title} className="px-4 text-center">
            <h3 className="mb-3 text-xl font-bold">{title}</h3>
            <p className="text-fd-muted-foreground">{description}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
