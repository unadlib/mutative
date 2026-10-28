'use client';

import { translator } from '@/lib/messages';
import {
  arraySpeedups,
  benchmarkRun,
  patchWorkloads,
  speedups,
} from '@/lib/benchmarks';
import { useI18n } from 'fumadocs-ui/contexts/i18n';
import { useId, useState, type ReactNode } from 'react';

const number = (value: number) =>
  value.toLocaleString('en-US', { maximumFractionDigits: 2 });
const factor = (value: number) => `${number(value)}×`;
const orange =
  'bg-[#d96f00] forced-colors:bg-[Highlight] forced-colors:forced-color-adjust-none';

function ChartFrame({
  title,
  description,
  controls,
  children,
  caption,
}: {
  title: string;
  description: string;
  controls?: ReactNode;
  children: ReactNode;
  caption: ReactNode;
}) {
  const id = useId();
  return (
    <figure
      aria-labelledby={id}
      className="not-prose my-7 overflow-hidden rounded-2xl border bg-fd-card/40 shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 border-b bg-fd-background/70 px-5 py-4 sm:px-6">
        <div>
          <p id={id} className="text-sm font-semibold text-fd-foreground">
            {title}
          </p>
          <p className="mt-1 text-xs text-fd-muted-foreground">{description}</p>
        </div>
        {controls}
      </div>
      <div className="p-5 sm:p-6">{children}</div>
      <figcaption className="border-t px-5 py-3 text-xs leading-relaxed text-fd-muted-foreground sm:px-6">
        {caption}
      </figcaption>
    </figure>
  );
}

function Toggle<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex max-w-full flex-wrap gap-0.5 rounded-lg border bg-fd-background p-0.5 text-xs"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={`rounded-md px-3 py-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fd-ring ${
            value === option.value
              ? 'bg-fd-accent font-medium text-fd-foreground'
              : 'text-fd-muted-foreground hover:text-fd-foreground'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function PerformanceOverview() {
  const locale = useI18n().locale === 'zh' ? 'zh' : 'en';
  const t = translator(locale);
  const comparisons = [
    {
      label: t('Matched settings'),
      detail: t('Same auto-freeze and patch settings'),
      ...speedups.matched,
    },
    {
      label: t('Each library’s defaults'),
      detail: t('Only Immer auto-freezes; patches off'),
      ...speedups.defaults,
    },
  ];
  const outcomes = [
    { key: 'faster', label: t('Mutative faster'), color: orange },
    {
      key: 'within',
      label: t('Within 5%'),
      color: 'bg-neutral-400 forced-colors:bg-[GrayText]',
    },
    {
      key: 'slower',
      label: t('Immer faster'),
      color: 'bg-sky-600 dark:bg-sky-400 forced-colors:bg-[CanvasText]',
    },
  ] as const;

  return (
    <ChartFrame
      title={t('The overall comparison')}
      description={
        locale === 'zh'
          ? `${benchmarkRun.workloads} 项工作负载 · Immer / Mutative 耗时比的几何平均值`
          : `${benchmarkRun.workloads} workloads · geometric mean of Immer / Mutative time`
      }
      caption={t(
        'Each card covers a different set of measured cases. Faster means more than 5% less time; the factors are geometric means, not a speedup guaranteed for every workload.'
      )}
    >
      <div className="grid gap-6 sm:grid-cols-2">
        {comparisons.map((comparison) => (
          <div key={comparison.label}>
            <p className="text-sm font-medium">{comparison.label}</p>
            <p className="mt-1 text-xs text-fd-muted-foreground">
              {comparison.detail}
            </p>
            <p className="mt-5 flex items-baseline gap-2">
              <span className="text-5xl font-semibold tracking-tighter text-[#b85e00] dark:text-fd-primary">
                {factor(comparison.factor)}
              </span>
              <span className="text-xs text-fd-muted-foreground">
                {t('faster on geometric mean')}
              </span>
            </p>
            <div
              aria-hidden
              className="mt-5 flex h-2.5 overflow-hidden rounded-full bg-fd-muted"
            >
              {outcomes.map(({ key, color }) => (
                <span
                  key={key}
                  className={color}
                  style={{
                    width: `${(comparison[key] / comparison.cases) * 100}%`,
                  }}
                />
              ))}
            </div>
            <p className="mt-3 text-sm">
              <span className="font-semibold tabular-nums">
                {comparison.faster} / {comparison.cases}
              </span>{' '}
              <span className="text-fd-muted-foreground">
                {t('cases favor Mutative')}
              </span>
            </p>
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-fd-muted-foreground">
              {outcomes.map(({ key, label, color }) => (
                <li key={key} className="flex items-center gap-1.5">
                  <span
                    aria-hidden
                    className={`size-2 rounded-full ${color}`}
                  />
                  {label}:{' '}
                  <span className="tabular-nums">{comparison[key]}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </ChartFrame>
  );
}

const modes = [
  { color: 'text-[#b85e00] dark:text-fd-primary', dash: undefined },
  { color: 'text-sky-700 dark:text-sky-400', dash: '6 4' },
  { color: 'text-violet-600 dark:text-violet-400', dash: '2 4' },
  { color: 'text-neutral-500 dark:text-neutral-400', dash: '8 4 2 4' },
];

export function ArrayScalingChart() {
  const locale = useI18n().locale === 'zh' ? 'zh' : 'en';
  const t = translator(locale);
  const [view, setView] = useState<'all' | 'moves'>('all');
  const id = useId();
  const ticks = view === 'all' ? [1, 2, 5, 10, 20] : [1, 10, 100, 1000];
  const max = ticks[ticks.length - 1];
  const y = (value: number) =>
    210 - (Math.log10(value) / Math.log10(max)) * 184;

  return (
    <ChartFrame
      title={t('How the gap changes with array size')}
      description={t('Immer / Mutative time · higher is better for Mutative')}
      controls={
        <Toggle
          label={t('Array workload group')}
          value={view}
          onChange={setView}
          options={[
            { value: 'all', label: t('All workloads') },
            { value: 'moves', label: t('Element moves') },
          ]}
        />
      }
      caption={t(
        'Both libraries use the same settings. The vertical axis is logarithmic; 1× means equal time. Element moves cover shift, unshift, splice insertion, and reverse. Immer’s array-method plugin is off.'
      )}
    >
      <div className="flex items-center justify-between gap-3 text-xs text-fd-muted-foreground">
        <span>
          {view === 'all'
            ? t('All large-array workloads')
            : t('Only workloads that move elements')}
        </span>
        <span className="shrink-0 rounded-full border px-2 py-0.5">
          {t('Log scale')}
        </span>
      </div>
      <svg
        viewBox="0 0 440 250"
        role="img"
        aria-labelledby={`${id}-title ${id}-description`}
        className="mt-3 block w-full overflow-visible text-fd-muted-foreground forced-colors:text-[CanvasText]"
      >
        <title id={`${id}-title`}>
          {locale === 'zh'
            ? `大数组性能倍数：${view === 'all' ? '全部场景' : '元素移动'}`
            : `Large-array speedups: ${view === 'all' ? 'all workloads' : 'element moves'}`}
        </title>
        <desc id={`${id}-description`}>
          {arraySpeedups
            .map((mode) =>
              locale === 'zh'
                ? `冻结${mode.freeze ? '开启' : '关闭'}，补丁${mode.patches ? '开启' : '关闭'}：1,000 行时 ${factor(mode[view][0])}，10,000 行时 ${factor(mode[view][1])}。`
                : `Freeze ${mode.freeze ? 'on' : 'off'}, patches ${mode.patches ? 'on' : 'off'}: ${factor(mode[view][0])} at 1,000 rows and ${factor(mode[view][1])} at 10,000 rows.`
            )
            .join(' ')}
        </desc>
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1="52"
              x2="420"
              y1={y(tick)}
              y2={y(tick)}
              stroke="currentColor"
              strokeOpacity={tick === 1 ? 0.5 : 0.15}
              strokeDasharray={tick === 1 ? '4 4' : undefined}
            />
            <text
              x="42"
              y={y(tick) + 4}
              textAnchor="end"
              fill="currentColor"
              fontSize="12"
            >
              {factor(tick)}
            </text>
          </g>
        ))}
        {[90, 382].map((x, index) => (
          <g key={x}>
            <line
              x1={x}
              x2={x}
              y1="26"
              y2="210"
              stroke="currentColor"
              strokeOpacity="0.12"
            />
            <text
              x={x}
              y="239"
              textAnchor="middle"
              fill="currentColor"
              fontSize="13"
            >
              {index === 0 ? t('1,000 rows') : t('10,000 rows')}
            </text>
          </g>
        ))}
        {arraySpeedups.map((mode, index) => (
          <g
            key={index}
            className={`${modes[index].color} forced-colors:text-[CanvasText]`}
          >
            <path
              d={`M 90 ${y(mode[view][0])} L 382 ${y(mode[view][1])}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeDasharray={modes[index].dash}
            />
            {mode[view].map((value, point) => (
              <circle
                key={point}
                cx={point === 0 ? 90 : 382}
                cy={y(value)}
                r="4"
                fill="currentColor"
                stroke="var(--color-fd-background)"
                strokeWidth="2"
              >
                <title>{`${t('Freeze')} ${mode.freeze ? t('on') : t('off')}, ${t('· patches')} ${mode.patches ? t('on') : t('off')} · ${t(point === 0 ? '1,000 rows' : '10,000 rows')}: ${factor(value)}`}</title>
              </circle>
            ))}
          </g>
        ))}
      </svg>
      <ul
        className="mt-3 grid gap-3 sm:grid-cols-2"
        aria-live="polite"
        aria-atomic="true"
      >
        {arraySpeedups.map((mode, index) => (
          <li
            key={index}
            className="flex items-start gap-2.5 rounded-lg border bg-fd-background/60 p-3 text-xs"
          >
            <svg
              aria-hidden
              viewBox="0 0 24 10"
              className={`mt-0.5 h-2.5 w-6 shrink-0 ${modes[index].color} forced-colors:text-[CanvasText]`}
            >
              <line
                x1="0"
                x2="24"
                y1="5"
                y2="5"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeDasharray={modes[index].dash}
              />
            </svg>
            <div className="min-w-0">
              <p className="font-medium">
                {t('Freeze')} {mode.freeze ? t('on') : t('off')}{' '}
                {t('· patches')} {mode.patches ? t('on') : t('off')}
              </p>
              <p className="mt-1 text-fd-muted-foreground">
                <span className="tabular-nums">
                  {factor(mode[view][0])} → {factor(mode[view][1])}
                </span>{' '}
                <span className="whitespace-nowrap">
                  {t('at 1k → 10k rows')}
                </span>
              </p>
            </div>
          </li>
        ))}
      </ul>
    </ChartFrame>
  );
}

export function PatchComparisonChart() {
  const locale = useI18n().locale === 'zh' ? 'zh' : 'en';
  const t = translator(locale);
  const [comparator, setComparator] = useState<'immer' | 'mutativeV1'>('immer');
  const label = comparator === 'immer' ? 'Immer' : 'Mutative 1.3.0';
  const comparisonColor =
    comparator === 'immer'
      ? 'bg-neutral-500 dark:bg-neutral-400 forced-colors:bg-[CanvasText]'
      : 'bg-sky-700 dark:bg-sky-400 forced-colors:bg-[CanvasText]';

  return (
    <ChartFrame
      title={t('The cost of updates with patches')}
      description={t('Microseconds per update · shorter is better')}
      controls={
        <Toggle
          label={t('Patch benchmark comparator')}
          value={comparator}
          onChange={setComparator}
          options={[
            { value: 'immer', label: 'Immer' },
            { value: 'mutativeV1', label: 'Mutative 1.3.0' },
          ]}
        />
      }
      caption={
        locale === 'zh'
          ? `开启补丁，关闭自动冻结，10,000 行。每个场景独立使用线性刻度。数据为 ${benchmarkRun.machine}、Node.js ${benchmarkRun.node} 上三次运行的中位数；Immer ${benchmarkRun.immer} 未开启数组方法插件。`
          : `Patches on, auto-freeze off, 10,000 rows. Each workload has its own linear scale. Medians of three runs on ${benchmarkRun.machine}, Node.js ${benchmarkRun.node}; Immer ${benchmarkRun.immer} with its array-method plugin off.`
      }
    >
      <div className="space-y-6" aria-live="polite" aria-atomic="true">
        {patchWorkloads.map((workload) => {
          const relativeTime = workload.mutative / workload[comparator];
          const max = Math.max(workload.mutative, workload[comparator]);
          return (
            <div key={workload.name}>
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <p className="text-sm font-medium">{t(workload.name)}</p>
                <p className="text-xs text-fd-muted-foreground">
                  {relativeTime < 0.95
                    ? locale === 'zh'
                      ? `性能为 ${label} 的 ${factor(1 / relativeTime)}`
                      : `${factor(1 / relativeTime)} faster than ${label}`
                    : relativeTime > 1.05
                      ? locale === 'zh'
                        ? `耗时为 ${label} 的 ${factor(relativeTime)}`
                        : `${factor(relativeTime)} slower than ${label}`
                      : t('Within 5%')}
                </p>
              </div>
              {(['mutative', comparator] as const).map((key) => (
                <div
                  key={key}
                  className="grid grid-cols-[5.75rem_minmax(0,1fr)_5rem] items-center gap-2 py-1 sm:grid-cols-[6.5rem_minmax(0,1fr)_5rem]"
                >
                  <span className="text-xs text-fd-muted-foreground">
                    {key === 'mutative' ? 'Mutative' : label}
                  </span>
                  <div aria-hidden className="h-2.5 rounded-r bg-fd-muted/60">
                    <div
                      className={`h-full rounded-r ${key === 'mutative' ? orange : comparisonColor}`}
                      style={{ width: `${(workload[key] / max) * 100}%` }}
                    />
                  </div>
                  <span
                    className={`text-right text-xs tabular-nums ${key === 'mutative' ? 'font-semibold' : 'text-fd-muted-foreground'}`}
                  >
                    {number(workload[key])} µs
                  </span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </ChartFrame>
  );
}
