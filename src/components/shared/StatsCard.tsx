import { RiArrowDownLine, RiArrowUpLine, type RemixiconComponentType } from "@remixicon/react";
import { Card, CardContent } from "@/components/ui/card";
import { formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Semantic tones only.
 *
 * These used to carry a per-module colour each — visa purple, hajj green, tour
 * cyan — so a row of four tiles came out in four hues and read as four
 * unrelated things. A tile's colour now says one of two things: nothing, in
 * which case it is the brand blue like every other tile, or that the figure
 * itself is good or bad. Module identity lives in the page heading and the
 * charts, where it belongs.
 */
export type StatsCardAccent = "primary" | "success" | "destructive";

/**
 * Tailwind cannot see a class assembled at runtime, so each tone is written
 * out in full. `bg-${accent}/10` would compile to nothing.
 */
const ICON_CLASSES: Record<StatsCardAccent, string> = {
  primary: "bg-primary text-primary-foreground",
  success: "bg-success text-success-foreground",
  destructive: "bg-destructive text-destructive-foreground",
};

interface StatsCardProps {
  title: string;
  /** Pre-formatted. Pass formatCurrency(...) or formatNumber(...), not a raw number. */
  value: string;
  icon?: RemixiconComponentType;
  /** Leave unset unless the figure being good or bad is the point. */
  accent?: StatsCardAccent;
  /** Small caption under the value — a comparison, a count, a date range. */
  hint?: string;
  /**
   * Percentage change, shown as a pill against the value.
   *
   * Coloured by sign, so only pass it where up is good. "Customers owe you"
   * rising is not a win, and a green arrow saying it is would be a lie told in
   * the most glanceable part of the card.
   */
  delta?: number | null;
  /**
   * Fills the card with the brand gradient.
   *
   * One per group, never more. Four identical tiles make the reader compare
   * all four to find the important one; filling one answers that before they
   * start. The rest of the group stays white so the filled one keeps meaning
   * something.
   */
  filled?: boolean;
  className?: string;
}

const DeltaPill = ({ delta, filled }: { delta: number; filled: boolean }) => {
  const rising = delta >= 0;
  const Arrow = rising ? RiArrowUpLine : RiArrowDownLine;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium",
        filled
          ? "bg-white/20 text-white"
          : rising
            ? "bg-success/10 text-success"
            : "bg-destructive/10 text-destructive",
      )}
    >
      <Arrow className="size-3" aria-hidden="true" />
      {formatPercent(Math.abs(delta), 0)}
    </span>
  );
};

/**
 * One figure, at a glance.
 *
 * The shape is the one every dashboard worth copying settles on: the label
 * and the icon on the top line at opposite ends, the number underneath at a
 * size you can read across a desk, and one line of context below it. Used on
 * fifteen screens, so it stays plain.
 */
const StatsCard = ({
  title,
  value,
  icon: Icon,
  accent = "primary",
  hint,
  delta,
  filled = false,
  className,
}: StatsCardProps) => (
  <Card
    className={cn(
      // Lifts a little under the cursor. Cheap to paint (no layout), and it
      // tells a touch user nothing, which is fine — nothing here is clickable.
      "gap-0 transition-shadow duration-200 hover:shadow-md",
      // The unfilled tiles are flat white, not washed: the filled one is the
      // only coloured surface in the group, which is the whole point of it.
      filled
        ? "border-transparent bg-gradient-primary text-white shadow-md"
        : "bg-card bg-none",
      className,
    )}
  >
    <CardContent className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <p
          className={cn(
            "min-w-0 flex-1 truncate text-sm",
            filled ? "text-white/85" : "text-muted-foreground",
          )}
        >
          {title}
        </p>

        {Icon && (
          <span
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-full",
              // Inverted on the filled tile: a white disc on the gradient,
              // rather than a blue disc that would vanish into it.
              filled ? "bg-white text-primary" : ICON_CLASSES[accent],
            )}
          >
            <Icon className="size-5" aria-hidden="true" />
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <p className="text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
        {delta !== null && delta !== undefined && <DeltaPill delta={delta} filled={filled} />}
      </div>

      {hint && (
        <p className={cn("text-xs", filled ? "text-white/75" : "text-muted-foreground")}>{hint}</p>
      )}
    </CardContent>
  </Card>
);

export default StatsCard;
