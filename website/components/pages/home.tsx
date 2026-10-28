import { type Locale } from '@/lib/i18n';
import { Adopters } from '@/components/home/adopters';
import { Benchmarks } from '@/components/home/benchmarks';
import { CallToAction } from '@/components/home/call-to-action';
import { CodeComparison } from '@/components/home/code-comparison';
import { Ecosystem } from '@/components/home/ecosystem';
import { Features } from '@/components/home/features';
import { Hero } from '@/components/home/hero';

export function HomePage({ locale = 'en' }: { locale?: Locale }) {
  return (
    <div className="flex flex-1 flex-col">
      <Hero locale={locale} />
      <CodeComparison locale={locale} />
      <Benchmarks locale={locale} />
      <Adopters locale={locale} />
      <Features locale={locale} />
      <Ecosystem locale={locale} />
      <CallToAction locale={locale} />
    </div>
  );
}
