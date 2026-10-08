import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
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
      {/* The hero keeps the dark palette in both color modes. */}
      <section className="dark bg-[#2b3137] px-5 py-12 text-white md:px-12">
        <div className="mx-auto flex max-w-[1100px] flex-col-reverse items-center gap-6 md:flex-row md:justify-between md:gap-10">
          <div>
            <h1 className="text-center text-4xl font-bold leading-tight md:text-left md:text-6xl">
              <b className="text-fd-primary">Better</b> immutability
              <br />
              <b className="text-fd-primary">Faster</b> immutable updates
            </h1>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-9 md:justify-start">
              <Link
                href="/docs/intro"
                className="rounded-lg bg-fd-primary px-8 py-3 text-lg font-semibold text-fd-primary-foreground transition-opacity hover:opacity-90"
              >
                Get Started
              </Link>
              <iframe
                className="hidden overflow-hidden md:block"
                src="https://ghbtns.com/github-btn.html?user=unadlib&repo=mutative&type=star&count=true&size=large"
                width={160}
                height={30}
                title="GitHub Stars"
              />
            </div>
          </div>
          <Image
            src="/img/logo.svg"
            alt="Mutative"
            width={200}
            height={200}
            loading="eager"
            className="shrink-0"
          />
        </div>
      </section>
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
