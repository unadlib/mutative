export type SeriesKey = 'mutative' | 'immer' | 'immerAutoFreeze';

/**
 * The libraries of the home page charts: Mutative in the accent, Immer in two
 * grays, steps checked for lightness, color-vision separation and contrast on
 * the card surfaces of each theme. The light gray stays below 3:1 there, so
 * every bar shows its name and value. Forced colors keep the bars with system
 * colors.
 */
export const series: { key: SeriesKey; label: string; color: string }[] = [
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
