'use client';

import { translator } from '@/lib/messages';
import { type Locale } from '@/lib/i18n';
import {
  benchmarkRun,
  chartWorkloads,
  type ChartWorkload,
} from '@/lib/benchmarks';
import { useRef, useState, type KeyboardEvent } from 'react';
import { series, type SeriesKey } from './benchmark-series';

const toNumber = (value: string) => Number(value.replace(/,/g, ''));

// Immer's time over Mutative's, both without auto-freeze.
function getFactor(workload: ChartWorkload) {
  return toNumber(workload.immer) / toNumber(workload.mutative);
}

function formatFactor(factor: number) {
  return `${factor.toLocaleString('en-US', {
    maximumFractionDigits: factor < 10 ? 1 : 0,
  })}x`;
}

// A bar is a library's time relative to Mutative's in its workload, and each
// workload scales its bars to its slowest time, since the times of the
// workloads differ by four orders of magnitude.
function getRatio(workload: ChartWorkload, key: SeriesKey) {
  const slowest = Math.max(...series.map(({ key }) => toNumber(workload[key])));
  return toNumber(workload[key]) / slowest;
}

const rowCount = chartWorkloads.length * series.length;

export function BenchmarkChart({ locale = 'en' }: { locale?: Locale }) {
  const t = translator(locale);
  const [view, setView] = useState<'chart' | 'table'>('chart');
  // The row whose details show, by hover or focus, and the row that the
  // keyboard reaches the chart at.
  const [active, setActive] = useState<number | null>(null);
  const [focusable, setFocusable] = useState(0);
  const rows = useRef<(HTMLDivElement | null)[]>([]);

  function moveFocus(event: KeyboardEvent<HTMLDivElement>) {
    const keys: Record<string, number> = {
      ArrowDown: focusable + 1,
      ArrowRight: focusable + 1,
      ArrowUp: focusable - 1,
      ArrowLeft: focusable - 1,
      Home: 0,
      End: rowCount - 1,
    };
    if (event.key === 'Escape') {
      setActive(null);
      return;
    }
    if (!(event.key in keys)) return;
    event.preventDefault();
    const next = Math.min(Math.max(keys[event.key], 0), rowCount - 1);
    setFocusable(next);
    rows.current[next]?.focus();
  }

  return (
    <figure className="rounded-2xl border bg-fd-background p-5 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div>
          <p className="font-medium">
            {t('Time per update, relative to Mutative')}
          </p>
          <p className="text-sm text-fd-muted-foreground">
            {t('Shorter is better')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-fd-muted-foreground">
            {series.map(({ key, label, color }) => (
              <li key={key} className="inline-flex items-center gap-2">
                <span aria-hidden className={`size-3 rounded-[3px] ${color}`} />
                {t(label)}
              </li>
            ))}
          </ul>
          <div
            role="group"
            aria-label={t('View')}
            className="inline-flex rounded-lg border bg-fd-card p-0.5 text-sm"
          >
            {(['chart', 'table'] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={view === option}
                onClick={() => setView(option)}
                className={`rounded-md px-3 py-1 capitalize transition-colors ${
                  view === option
                    ? 'bg-fd-background font-medium text-fd-foreground shadow-sm'
                    : 'text-fd-muted-foreground hover:text-fd-foreground'
                }`}
              >
                {t(option)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        hidden={view !== 'chart'}
        onKeyDown={moveFocus}
        className="mt-8 grid gap-x-12 gap-y-10 md:grid-cols-2"
      >
        {chartWorkloads.map((workload, workloadIndex) => (
          <div
            key={workload.name}
            role="group"
            aria-labelledby={`benchmark-${workloadIndex}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 id={`benchmark-${workloadIndex}`} className="font-medium">
                  {t(workload.name)}
                </h3>
                <p className="text-sm text-fd-muted-foreground">
                  {t(workload.detail)}
                </p>
              </div>
              <p className="shrink-0 text-right text-sm">
                {locale === 'zh' ? (
                  <span className="text-fd-muted-foreground">
                    {t('faster')}{' '}
                    <span className="font-semibold text-fd-foreground">
                      {formatFactor(getFactor(workload)).replace(/x$/, ' 倍')}
                    </span>
                  </span>
                ) : (
                  <>
                    <span className="font-semibold">
                      {formatFactor(getFactor(workload))}
                    </span>{' '}
                    <span className="text-fd-muted-foreground">
                      {t('faster')}
                    </span>
                  </>
                )}
              </p>
            </div>
            <div
              role="list"
              className="relative mt-4 grid grid-cols-[7rem_minmax(0,1fr)] gap-x-2 gap-y-1 sm:grid-cols-[8.75rem_minmax(0,1fr)]"
            >
              {/* The baseline of the bars. */}
              <div
                aria-hidden
                className="col-start-2 row-span-3 row-start-1 border-l border-fd-border"
              />
              {series.map(({ key, label, color }, seriesIndex) => {
                const index = workloadIndex * series.length + seriesIndex;
                const ratio = getRatio(workload, key);
                const isActive = active === index;
                const multiple = formatFactor(
                  toNumber(workload[key]) / toNumber(workload.mutative)
                );
                const details =
                  key === 'mutative'
                    ? t(label)
                    : locale === 'zh'
                      ? `${t(label)} · 耗时为 Mutative 的 ${multiple}`
                      : `${label} · ${multiple} Mutative's time`;
                return (
                  <div
                    key={key}
                    role="listitem"
                    aria-label={`${details}: ${workload[key]} ${t('µs per update')}`}
                    ref={(element) => {
                      rows.current[index] = element;
                    }}
                    tabIndex={index === focusable ? 0 : -1}
                    onFocus={() => {
                      setFocusable(index);
                      setActive(index);
                    }}
                    onBlur={() =>
                      setActive((current) =>
                        current === index ? null : current
                      )
                    }
                    onPointerEnter={() => setActive(index)}
                    onPointerLeave={() =>
                      setActive((current) =>
                        current === index ? null : current
                      )
                    }
                    style={{ gridRowStart: seriesIndex + 1 }}
                    className={`col-span-2 col-start-1 grid grid-cols-subgrid items-center rounded-md outline-none transition-colors focus-visible:ring-2 focus-visible:ring-fd-ring ${
                      isActive ? 'bg-fd-accent/50' : ''
                    }`}
                  >
                    <span className="whitespace-nowrap pl-1 text-xs text-fd-muted-foreground sm:text-sm">
                      {t(label)}
                    </span>
                    <div className="flex h-7 items-center">
                      <div
                        className="relative h-3 shrink-0"
                        style={{
                          width: `max(3px, calc((100% - 4.5rem) * ${ratio}))`,
                        }}
                      >
                        <div className={`h-full rounded-r-[4px] ${color}`} />
                        {isActive && (
                          <div
                            aria-hidden
                            className={`pointer-events-none absolute bottom-full z-10 mb-2 whitespace-nowrap rounded-lg border bg-fd-popover px-2.5 py-1.5 text-xs text-fd-popover-foreground shadow-md ${
                              ratio < 0.25
                                ? 'left-0'
                                : ratio > 0.8
                                  ? 'right-0'
                                  : 'left-full -translate-x-1/2'
                            }`}
                          >
                            <span className="block font-semibold text-fd-foreground">
                              {workload[key]} {t('µs per update')}
                            </span>
                            <span className="mt-0.5 flex items-center gap-1.5 text-fd-muted-foreground">
                              <span
                                className={`h-0.5 w-3 rounded-full ${color}`}
                              />
                              {details}
                            </span>
                          </div>
                        )}
                      </div>
                      <span
                        className={`ml-2 shrink-0 whitespace-nowrap text-sm ${
                          key === 'mutative'
                            ? 'font-semibold text-fd-foreground'
                            : 'text-fd-muted-foreground'
                        }`}
                      >
                        {multiple}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div hidden={view !== 'table'} className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[38rem] text-sm">
          <caption className="sr-only">
            {t('Microseconds per update, shorter is better')}
          </caption>
          <thead>
            <tr className="border-b text-left text-fd-muted-foreground">
              <th scope="col" className="py-2 pr-4 font-medium">
                {t('Workload')}
              </th>
              {series.map(({ key, label }) => (
                <th
                  key={key}
                  scope="col"
                  className="whitespace-nowrap px-4 py-2 text-right font-medium"
                >
                  {t(label)}
                </th>
              ))}
              <th
                scope="col"
                className="whitespace-nowrap py-2 pl-4 text-right font-medium"
              >
                {t('Faster than Immer')}
              </th>
            </tr>
          </thead>
          <tbody>
            {chartWorkloads.map((workload) => (
              <tr key={workload.name} className="border-b last:border-b-0">
                <th scope="row" className="py-2 pr-4 text-left font-normal">
                  {t(workload.name)}
                  <span className="block text-fd-muted-foreground">
                    {t(workload.detail)}
                  </span>
                </th>
                {series.map(({ key }) => (
                  <td
                    key={key}
                    className="whitespace-nowrap px-4 py-2 text-right tabular-nums"
                  >
                    {workload[key]} µs
                  </td>
                ))}
                <td className="whitespace-nowrap py-2 pl-4 text-right tabular-nums">
                  {formatFactor(getFactor(workload))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <figcaption className="mt-8 text-sm text-fd-muted-foreground">
        {locale === 'zh'
          ? `在 ${benchmarkRun.machine}、Node.js ${benchmarkRun.node}、Immer ${benchmarkRun.immer} 上独立进程运行三次的中位数，均关闭补丁。条形表示各场景中相对于 Mutative 的单次更新耗时，表格以微秒列出耗时。Mutative 和第一条 Immer 关闭自动冻结，第二条 Immer 使用默认配置。多数场景中，只复制变化部分的手写 reducer 仍然更快。`
          : `Medians of three runs on an ${benchmarkRun.machine} with Node.js ${benchmarkRun.node} and Immer ${benchmarkRun.immer}, each library in a process of its own, without patches. Each bar is a library's time per update relative to Mutative's in its workload, and the table lists the times in microseconds. Mutative and the first Immer bar run without auto-freeze; the second Immer bar shows Immer's default. Hand-written reducers that copy only what they change are faster still in most workloads.`}
      </figcaption>
    </figure>
  );
}
