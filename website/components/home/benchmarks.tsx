import { translator } from '@/lib/messages';
import { localePath, type Locale } from '@/lib/i18n';
import { benchmarkRun, speedups } from '@/lib/benchmarks';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { BenchmarkChart } from './benchmark-chart';
import { SectionHeading } from './section-heading';

// The results of the performance page in the docs.
const stats = [
  {
    value: `${speedups.matched.factor}x`,
    label: 'Faster than Immer with matched settings',
    detail: `Faster in ${speedups.matched.faster} of ${speedups.matched.cases} measured cases`,
  },
  {
    value: `${speedups.defaults.factor}x`,
    label: "Faster than Immer with each library's defaults",
    detail: `Faster in ${speedups.defaults.faster} of ${speedups.defaults.cases} measured cases`,
  },
  {
    value: `${benchmarkRun.workloads}`,
    label: 'Benchmarked workloads',
    detail: 'Every result checked against hand-written reducers',
  },
];

export function Benchmarks({ locale = 'en' }: { locale?: Locale }) {
  const t = translator(locale);
  return (
    <section className="border-y bg-fd-card/50">
      <div className="mx-auto w-full max-w-[1100px] px-4 py-20 md:py-28">
        <SectionHeading
          eyebrow={t('Fast')}
          title={t('Faster than Immer, by design')}
        >
          {t(
            'Mutative copies each object at most once per update and moves array elements natively on its copy, instead of through a draft proxy.'
          )}
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
              <p className="mt-3 font-medium">{t(stat.label)}</p>
              <p className="mt-1 text-sm text-fd-muted-foreground">
                {locale === 'zh'
                  ? stat === stats[0]
                    ? `${speedups.matched.cases} 个测量案例中，${speedups.matched.faster} 个更快`
                    : stat === stats[1]
                      ? `${speedups.defaults.cases} 个测量案例中，${speedups.defaults.faster} 个更快`
                      : t(stat.detail)
                  : stat.detail}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <BenchmarkChart locale={locale} />
        </div>
        <p className="mt-8 text-center text-sm text-fd-muted-foreground">
          {locale === 'zh'
            ? `卡片中的倍数为全部 ${benchmarkRun.workloads} 项工作负载中，Immer 耗时与 Mutative 耗时之比的几何平均值。`
            : `The factors of the cards are geometric means of Immer's time over Mutative's across all ${benchmarkRun.workloads} workloads.`}{' '}
          <Link
            href={localePath('/docs/getting-started/performance', locale)}
            className="inline-flex items-center gap-1 font-medium text-fd-foreground underline decoration-fd-primary underline-offset-4 transition-opacity hover:opacity-80"
          >
            {t('See the benchmarks')}
            <ArrowRight className="size-3.5" />
          </Link>
        </p>
      </div>
    </section>
  );
}
