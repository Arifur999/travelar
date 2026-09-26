import { RiArrowDownLine, RiArrowUpLine, type RemixiconComponentType } from "@remixicon/react";
import { Card, CardContent } from "@/components/ui/card";
import { formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

export type StatsCardAccent =
  | "primary"
  | "visa"
  | "hajj"
  | "tour"
  | "hotel"
  | "expense"
  | "ledger"
  | "success"
  | "destructive";

/**
 * Tailwind cannot see a class assembled at runtime, so each accent is written
 * out in full. `bg-${accent}/10` would compile to nothing.
 */
const ACCENT_CLASSES: Record<StatsCardAccent, string> = {
  primary: "bg-primary/10 text-primary",
  visa: "bg-visa/10 text-visa",
  hajj: "bg-hajj/10 text-hajj",
  tour: "bg-tour/10 text-tour",
  hotel: "bg-hotel/10 text-hotel",
  expense: "bg-expense/10 text-expense",
  ledger: "bg-ledger/10 text-ledger",
  success: "bg-success/10 text-success",
  destructive: "bg-destructive/10 text-destructive",
};

interface StatsCardProps {
  title: string;
  /** Pre-formatted. Pass formatCurrency(...) or formatNumber(...), not a raw number. */
  value: string;
  icon?: RemixiconComponentType;
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
   * start. The rest of the group stays light so the filled one keeps meaning
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
 * Used on every summary screen in the app, so the shape is deliberately plain:
 * a label, a number large enough to read across a desk, and at most one piece
 * of context under it. `filled` is the only variation, and it exists to give a
 * group of tiles a centre of gravity.
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
      "transition-shadow duration-200 hover:shadow-md",
      filled && "border-transparent bg-gradient-primary text-white shadow-md",
      className,
    )}
  >
    <CardContent className="flex items-start gap-3">
      {Icon && (
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl",
            filled ? "bg-white/15 text-white" : ACCENT_CLASSES[accent],
          )}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>
      )}

      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm", filled ? "text-white/80" : "text-muted-foreground")}>
          {title}
        </p>

        <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <p className="text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
          {delta !== null && delta !== undefined && <DeltaPill delta={delta} filled={filled} />}
        </div>

        {hint && (
          <p className={cn("mt-1 text-xs", filled ? "text-white/70" : "text-muted-foreground")}>
            {hint}
          </p>
        )}
      </div>
    </CardContent>
  </Card>
);

export default StatsCard;
