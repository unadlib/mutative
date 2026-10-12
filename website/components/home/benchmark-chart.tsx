'use client';

import {
  benchmarkRun,
  chartWorkloads,
  type ChartWorkload,
} from '@/lib/benchmarks';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';

type SeriesKey = 'mutative' | 'immer' | 'immerAutoFreeze';

// Mutative in the accent, Immer in two grays: steps checked for lightness,
// color-vision separation and contrast on the card surface of each theme. The
// light gray stays below 3:1 there, so every bar carries its name and value.
// Forced colors keep the bars with system colors.
const series: { key: SeriesKey; label: string; color: string }[] = [
  {
    key: 'mutative',
    label: 'Mutative',
    color:
      'bg-[#d96f00] forced-colors:bg-[Highlight] forced-colors:forced-color-adjust-none',
  },
  {
    key: 'immer',
    label: 'Immer',
    color:
      'bg-[#737373] dark:bg-[#929292] forced-colors:bg-[CanvasText] forced-colors:forced-color-adjust-none',
  },
  {
    key: 'immerAutoFreeze',
    label: 'Immer, auto-freeze',
    color:
      'bg-[#a3a3a3] dark:bg-[#626262] forced-colors:bg-[GrayText] forced-colors:forced-color-adjust-none',
  },
];

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

// Each workload scales its bars to its slowest time, since the times of the
// workloads differ by four orders of magnitude.
function getRatio(workload: ChartWorkload, key: SeriesKey) {
  const slowest = Math.max(...series.map(({ key }) => toNumber(workload[key])));
  return toNumber(workload[key]) / slowest;
}

// The bars of a workload grow when it scrolls into view, unless it is on
// screen when the page loads or the reader prefers reduced motion. The static
// HTML holds the grown bars.
type Motion = 'static' | 'ready' | 'growing';

const barMotion: Record<Motion, string> = {
  static: '',
  ready: 'scale-x-0',
  growing:
    'scale-x-100 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
};

const rowCount = chartWorkloads.length * series.length;

export function BenchmarkChart() {
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const [motion, setMotion] = useState<Motion[]>(() =>
    chartWorkloads.map(() => 'static')
  );
  // The row whose details show, by hover or focus, and the row that the
  // keyboard reaches the chart at.
  const [active, setActive] = useState<number | null>(null);
  const [focusable, setFocusable] = useState(0);
  const facets = useRef<(HTMLDivElement | null)[]>([]);
  const rows = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (
      typeof IntersectionObserver === 'undefined' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }
    const setFacet = (index: number, value: Motion) =>
      setMotion((current) =>
        current.map((item, i) => (i === index ? value : item))
      );
    const seen = new Set<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const index = facets.current.indexOf(entry.target as HTMLDivElement);
          if (!seen.has(entry.target)) {
            seen.add(entry.target);
            if (entry.isIntersecting) {
              observer.unobserve(entry.target);
            } else {
              setFacet(index, 'ready');
            }
          } else if (entry.isIntersecting) {
            setFacet(index, 'growing');
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -15% 0px' }
    );
    for (const facet of facets.current) {
      if (facet) observer.observe(facet);
    }
    return () => observer.disconnect();
  }, []);

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
          <p className="font-medium">Microseconds per update</p>
          <p className="text-sm text-fd-muted-foreground">Shorter is better</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-fd-muted-foreground">
            {series.map(({ key, label, color }) => (
              <li key={key} className="inline-flex items-center gap-2">
                <span aria-hidden className={`size-3 rounded-[3px] ${color}`} />
                {label}
              </li>
            ))}
          </ul>
          <div
            role="group"
            aria-label="View"
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
                {option}
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
            ref={(element) => {
              facets.current[workloadIndex] = element;
            }}
            role="group"
            aria-labelledby={`benchmark-${workloadIndex}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 id={`benchmark-${workloadIndex}`} className="font-medium">
                  {workload.name}
                </h3>
                <p className="text-sm text-fd-muted-foreground">
                  {workload.detail}
                </p>
              </div>
              <p className="shrink-0 text-right text-sm">
                <span className="font-semibold">
                  {formatFactor(getFactor(workload))}
                </span>{' '}
                <span className="text-fd-muted-foreground">faster</span>
              </p>
            </div>
            <div
              role="list"
              className="relative mt-4 grid grid-cols-[7rem_minmax(0,1fr)] gap-x-2 gap-y-1 sm:grid-cols-[8.75rem_minmax(0,1fr)]"
            >
              {/* The baseline that the bars grow from. */}
              <div
                aria-hidden
                className="col-start-2 row-span-3 row-start-1 border-l border-fd-border"
              />
              {series.map(({ key, label, color }, seriesIndex) => {
                const index = workloadIndex * series.length + seriesIndex;
                const ratio = getRatio(workload, key);
                const isActive = active === index;
                const details =
                  key === 'mutative'
                    ? label
                    : `${label} · ${formatFactor(
                        toNumber(workload[key]) / toNumber(workload.mutative)
                      )} Mutative's time`;
                return (
                  <div
                    key={key}
                    role="listitem"
                    aria-label={`${details}: ${workload[key]} µs per update`}
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
                      {label}
                    </span>
                    <div className="flex h-7 items-center">
                      <div
                        className="relative h-3 shrink-0"
                        style={{
                          width: `max(3px, calc((100% - 4.5rem) * ${ratio}))`,
                        }}
                      >
                        <div
                          className={`h-full origin-left rounded-r-[4px] ${color} ${
                            barMotion[motion[workloadIndex]]
                          }`}
                          style={{ transitionDelay: `${seriesIndex * 90}ms` }}
                        />
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
                              {workload[key]} µs per update
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
                        {workload[key]} µs
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
            Microseconds per update, shorter is better
          </caption>
          <thead>
            <tr className="border-b text-left text-fd-muted-foreground">
              <th scope="col" className="py-2 pr-4 font-medium">
                Workload
              </th>
              {series.map(({ key, label }) => (
                <th
                  key={key}
                  scope="col"
                  className="whitespace-nowrap px-4 py-2 text-right font-medium"
                >
                  {label}
                </th>
              ))}
              <th
                scope="col"
                className="whitespace-nowrap py-2 pl-4 text-right font-medium"
              >
                Faster than Immer
              </th>
            </tr>
          </thead>
          <tbody>
            {chartWorkloads.map((workload) => (
              <tr key={workload.name} className="border-b last:border-b-0">
                <th scope="row" className="py-2 pr-4 text-left font-normal">
                  {workload.name}
                  <span className="block text-fd-muted-foreground">
                    {workload.detail}
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
        {`Medians of three runs on an ${benchmarkRun.machine} with Node.js ${benchmarkRun.node} and Immer ${benchmarkRun.immer}, each library in a process of its own, without patches. Mutative and the first Immer bar run without auto-freeze; the second Immer bar shows Immer's default. Each workload is scaled to its slowest time, and its factor compares Mutative with Immer under the same settings. Hand-written reducers that copy only what they change are faster still in most workloads.`}
      </figcaption>
    </figure>
  );
}
