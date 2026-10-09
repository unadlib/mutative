import { ArrowRight, Zap } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { GitHubButton } from './github-button';
import { InstallCommand } from './install-command';

// Darker in light mode, so that the words keep a 3:1 contrast.
const brandText =
  'bg-linear-to-r from-[#c25e00] to-[#d96f00] bg-clip-text text-transparent dark:from-[#ff8800] dark:to-[#ffb24d]';

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b">
      {/* A grid that fades out, under a glow of the primary color. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            'linear-gradient(to right, var(--color-fd-border) 1px, transparent 1px), linear-gradient(to bottom, var(--color-fd-border) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage:
            'radial-gradient(ellipse 70% 60% at 50% 0%, black 40%, transparent 100%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-48 left-1/2 h-[520px] w-[min(1000px,140vw)] -translate-x-1/2 rounded-full bg-fd-primary/25 blur-[120px]"
      />
      <div className="relative mx-auto flex max-w-[1100px] flex-col items-center px-4 pb-20 pt-16 text-center md:pb-28 md:pt-24">
        <Image
          src="/img/logo.svg"
          alt="Mutative"
          width={96}
          height={96}
          loading="eager"
          className="drop-shadow-[0_8px_32px_rgba(255,136,0,0.35)]"
        />
        <Link
          href="/docs/getting-started/performance"
          className="group mt-8 inline-flex items-center gap-2 rounded-full border bg-fd-card/80 px-4 py-1.5 text-sm text-fd-muted-foreground shadow-sm backdrop-blur transition-colors hover:text-fd-foreground"
        >
          <Zap className="size-3.5 fill-fd-primary text-fd-primary" />
          <span>
            About 3.6x faster than Immer
            <span className="hidden sm:inline"> across 97 workloads</span>
          </span>
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
        <h1 className="mt-6 text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
          <span className={brandText}>Better</span> immutability
          <br />
          <span className={brandText}>Faster</span> immutable updates
        </h1>
        <p className="mt-6 max-w-[640px] text-lg text-fd-muted-foreground md:text-xl">
          A JavaScript library for efficient immutable updates. Write plain
          mutations on a draft, and get the next immutable state.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/docs/intro"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-fd-primary px-6 font-semibold text-fd-primary-foreground shadow-[0_8px_24px_-8px_rgba(255,136,0,0.6)] transition-colors hover:bg-fd-primary/90"
          >
            Get Started
            <ArrowRight className="size-4" />
          </Link>
          <GitHubButton />
        </div>
        <div className="mt-8">
          <InstallCommand />
        </div>
      </div>
    </section>
  );
}
