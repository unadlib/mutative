import { translator } from '@/lib/messages';
import { localePath, type Locale } from '@/lib/i18n';
import { benchmarkRun, speedups } from '@/lib/benchmarks';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import { series, type SeriesKey } from './benchmark-series';

// The time of the same updates relative to Mutative's: Immer with the same
// settings, and Immer with its default auto-freeze against Mutative without.
const factors: Record<SeriesKey, number> = {
  mutative: 1,
  immer: speedups.matched.factor,
  immerAutoFreeze: speedups.defaults.factor,
};

const slowest = Math.max(...Object.values(factors));

// Seconds that the longest bar grows for, and before the bars start. The bars
// grow at one speed, so each stops after a time proportional to its length.
const duration = 2.4;
const delay = 0.4;

/**
 * The overall comparison of the hero. It is animated in CSS alone, so it runs
 * without JavaScript and on the compositor; see `.race-bar` in
 * `app/global.css`.
 */
export function OverallComparison({ locale = 'en' }: { locale?: Locale }) {
  const t = translator(locale);
  return (
    <figure className="mt-8 w-full max-w-[640px] rounded-2xl border bg-fd-card/90 p-5 text-left shadow-sm sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <p className="text-sm font-medium">{t('Time for the same updates')}</p>
        <p className="text-xs text-fd-muted-foreground">
          {t('Shorter is better')}
        </p>
      </div>
      <ul className="mt-3">
        {series.map(({ key, label, color }) => {
          const ratio = factors[key] / slowest;
          const timing = {
            '--race-duration': `${(duration * ratio).toFixed(3)}s`,
            '--race-delay': `${delay}s`,
          } as CSSProperties;
          return (
            <li
              key={key}
              className="grid grid-cols-[7rem_minmax(0,1fr)] items-center gap-x-2 sm:grid-cols-[8.75rem_minmax(0,1fr)]"
            >
              <span className="whitespace-nowrap text-xs text-fd-muted-foreground sm:text-sm">
                {t(label)}
              </span>
              <div className="flex h-7 items-center" style={timing}>
                <div
                  aria-hidden
                  className="h-2.5 shrink-0"
                  style={{ width: `calc((100% - 3.5rem) * ${ratio})` }}
                >
                  <div
                    className={`race-bar h-full origin-left rounded-r-[4px] ${color}`}
                  />
                </div>
                <span
                  className={`race-value ml-2 whitespace-nowrap text-sm ${
                    key === 'mutative'
                      ? 'font-semibold text-fd-foreground'
                      : 'text-fd-muted-foreground'
                  }`}
                >
                  {`${factors[key]}x`}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
      <figcaption className="mt-3 text-xs text-fd-muted-foreground">
        {locale === 'zh'
          ? `基于 ${benchmarkRun.workloads} 项工作负载的几何平均值，分别比较相同配置和各自默认配置（仅 Immer 冻结）。相同配置的 ${speedups.matched.cases} 个测量案例中，Mutative 在 ${speedups.matched.faster} 个案例中更快。`
          : `Geometric means over ${benchmarkRun.workloads} workloads, with the same settings for both libraries, and with each library's defaults, where only Immer freezes. Mutative was faster in ${speedups.matched.faster} of ${speedups.matched.cases} measured cases.`}{' '}
        <Link
          href={localePath('/docs/getting-started/performance', locale)}
          className="inline-flex items-center gap-1 font-medium text-fd-foreground underline decoration-fd-primary underline-offset-4 transition-opacity hover:opacity-80"
        >
          {t('See the benchmarks')}
          <ArrowRight className="size-3" />
        </Link>
      </figcaption>
    </figure>
  );
}
