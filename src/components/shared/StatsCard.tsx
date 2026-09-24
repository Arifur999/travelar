import { type RemixiconComponentType } from "@remixicon/react";
import { Card, CardContent } from "@/components/ui/card";
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
  className?: string;
}

const StatsCard = ({
  title,
  value,
  icon: Icon,
  accent = "primary",
  hint,
  className,
}: StatsCardProps) => (
  <Card className={className}>
    <CardContent className="flex items-start gap-3">
      {Icon && (
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            ACCENT_CLASSES[accent],
          )}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>
      )}

      <div className="min-w-0">
        <p className="truncate text-sm text-muted-foreground">{title}</p>
        <p className="mt-0.5 text-xl font-semibold tabular-nums">{value}</p>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
    </CardContent>
  </Card>
);

export default StatsCard;
