/**
 * Axis text for every chart on the page, from the theme.
 *
 * Recharts 3 paints tick labels with a hard-coded `fill="#666"`. The generated
 * chart primitive means to override that with `fill-muted-foreground`, but its
 * selector targets `.recharts-cartesian-axis-tick text`, and Recharts 3 renamed
 * that wrapper to `…-tick-label` — so the override never applies, and on the
 * dark theme the labels come out as dim grey on navy. Passing the fill here
 * fixes it without editing the generated file.
 */
export const AXIS_TICK = { fill: "var(--muted-foreground)", fontSize: 12 } as const;
