import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function CallToAction() {
  return (
    <section className="mx-auto w-full max-w-[1100px] px-4 py-16 md:py-24">
      <div className="relative overflow-hidden rounded-3xl border bg-fd-card px-6 py-16 text-center md:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              'linear-gradient(to right, var(--color-fd-border) 1px, transparent 1px), linear-gradient(to bottom, var(--color-fd-border) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            maskImage:
              'radial-gradient(ellipse 60% 80% at 50% 100%, black 30%, transparent 100%)',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 left-1/2 h-80 w-[min(720px,120vw)] -translate-x-1/2 rounded-full bg-fd-primary/25 blur-[100px]"
        />
        <div className="relative">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Ready to try Mutative?
          </h2>
          <p className="mx-auto mt-4 max-w-[520px] text-lg text-fd-muted-foreground">
            Learn the most important Mutative concepts in 5 minutes.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/docs/getting-started"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-fd-primary px-6 font-semibold text-fd-primary-foreground shadow-[0_8px_24px_-8px_rgba(255,136,0,0.6)] transition-colors hover:bg-fd-primary/90"
            >
              Get Started
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/docs/advanced-guides/migration"
              className="inline-flex h-11 items-center rounded-xl border bg-fd-secondary/80 px-6 font-semibold text-fd-secondary-foreground shadow-sm transition-colors hover:bg-fd-accent"
            >
              Migrate from Immer
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
