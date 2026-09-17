import Link from "next/link";
import { Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { goalProgress } from "@/lib/dashboardCharts";
import { formatCurrency, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

const RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * A plain SVG ring rather than a chart: it is one number against one target,
 * and drawing it with stroke-* classes keeps it on the theme tokens.
 */
const Ring = ({
  label,
  actual,
  goal,
  toneClass,
}: {
  label: string;
  actual: number;
  goal: number;
  toneClass: string;
}) => {
  const progress = goalProgress(actual, goal);

  if (!progress) {
    return (
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex size-28 items-center justify-center rounded-full border-[10px] border-muted">
          <span className="text-xs text-muted-foreground">No goal</span>
        </div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{formatCurrency(actual, { whole: true })} so far</p>
      </div>
    );
  }

  const offset = CIRCUMFERENCE * (1 - progress.ringPercent / 100);

  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div
        className="relative size-28"
        role="progressbar"
        aria-label={`${label} against this month's goal`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress.ringPercent)}
        aria-valuetext={`${formatPercent(progress.percent, 0)} of goal`}
      >
        <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden="true">
          <circle cx="50" cy="50" r={RADIUS} fill="none" strokeWidth="10" className="stroke-muted" />
          <circle
            cx="50"
            cy="50"
            r={RADIUS}
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            className={cn("transition-[stroke-dashoffset] duration-700", progress.met ? "stroke-success" : toneClass)}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-lg font-semibold tabular-nums">
          {formatPercent(progress.percent, 0)}
        </span>
      </div>
      <p className="text-sm font-medium">
        {label}
        {progress.met && <span className="ml-1 text-success">— met</span>}
      </p>
      <p className="text-xs text-muted-foreground tabular-nums">
        {formatCurrency(actual, { whole: true })} of {formatCurrency(goal, { whole: true })}
      </p>
    </div>
  );
};

const GoalRings = ({
  salesGoal,
  profitGoal,
  actualSales,
  actualProfit,
  canSetGoals,
}: {
  salesGoal: number;
  profitGoal: number;
  actualSales: number;
  actualProfit: number;
  canSetGoals: boolean;
}) => {
  const noGoals = salesGoal <= 0 && profitGoal <= 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>This month&apos;s goals</CardTitle>
        <CardDescription>How far along the month&apos;s targets are.</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col justify-center">
        {noGoals ? (
          <div className="flex h-60 flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-4 text-center">
            <Target className="size-6 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">
              {canSetGoals
                ? "Set a sales and profit target for the month to track it here."
                : "No targets have been set for this month."}
            </p>
            {canSetGoals && (
              <Button asChild size="sm" variant="outline">
                <Link href="/dashboard/goals">Set goals</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 py-4">
            <Ring label="Sales" actual={actualSales} goal={salesGoal} toneClass="stroke-primary" />
            <Ring label="Profit" actual={actualProfit} goal={profitGoal} toneClass="stroke-ledger" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GoalRings;
