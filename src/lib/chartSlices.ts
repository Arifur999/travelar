/**
 * What a ring chart can actually draw.
 *
 * Kept free of React because the decisions here are the ones that go quietly
 * wrong — a slice worth nothing drawn as a hairline, a negative one folded in
 * so every other share is overstated, a total that disagrees with the legend
 * beside it.
 */

export interface ChartSlice {
  key: string;
  label: string;
  value: number;
  /**
   * A theme colour expression — `var(--chart-1)`, `var(--visa)`. Never a
   * literal hex, or the slice stays light in the dark theme.
   */
  color: string;
  /** A short trailing note, such as a count. */
  note?: string;
}

export interface ShapedSlice extends ChartSlice {
  /** 0–100, of the drawn total. */
  share: number;
}

/**
 * The slices worth drawing, each with its share of the total.
 *
 * Zero is dropped rather than drawn as a hairline with a 0% label. Negative is
 * dropped too: a ring has no way to show a value below zero, and adding it in
 * would quietly overstate every other slice — a −500 alongside 1,500 would
 * leave a "total" of 1,000 and shares over 100%.
 */
export const shapeSlices = (slices: ChartSlice[]): ShapedSlice[] => {
  const drawable = slices.filter((slice) => slice.value > 0);
  const total = drawable.reduce((sum, slice) => sum + slice.value, 0);

  return drawable.map((slice) => ({
    ...slice,
    share: total > 0 ? (slice.value / total) * 100 : 0,
  }));
};

/**
 * The figure printed in the middle of the ring: what the drawn slices add up
 * to, so it always matches the arcs around it rather than the raw input.
 */
export const slicesTotal = (slices: ChartSlice[]): number =>
  shapeSlices(slices).reduce((sum, slice) => sum + slice.value, 0);

/** The five chart slots, in order. */
export const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const;

/**
 * The colour for the nth item of a series whose length is not known up front —
 * owners, accounts, categories. It wraps, so a sixth item repeats the first
 * rather than coming out unpainted.
 */
export const seriesColor = (index: number): string =>
  CHART_COLORS[index % CHART_COLORS.length];

/**
 * A slice key that is safe to build a CSS custom property from.
 *
 * ChartContainer writes `--color-<key>`, so a key taken straight from a name —
 * "Md. Karim", "City Bank (main)" — produces a property no browser will read,
 * and that slice is drawn unpainted. The index is kept on the end because two
 * different names can clean down to the same string.
 */
export const safeKey = (value: string, index: number): string => {
  const cleaned = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned ? `${cleaned}-${index}` : `slice-${index}`;
};
