import { Benchmarks } from '@/components/home/benchmarks';
import { CallToAction } from '@/components/home/call-to-action';
import { CodeComparison } from '@/components/home/code-comparison';
import { Ecosystem } from '@/components/home/ecosystem';
import { Features } from '@/components/home/features';
import { Hero } from '@/components/home/hero';
import { feedTypes } from '@/lib/metadata';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
    types: feedTypes,
  },
};

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col">
      <Hero />
      <CodeComparison />
      <Benchmarks />
      <Features />
      <Ecosystem />
      <CallToAction />
    </div>
  );
}
