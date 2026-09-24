"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildSetupSteps, isSetupComplete } from "@/lib/setupSteps";
import { cn } from "@/lib/utils";
import { type ISetupProgress } from "@/types/dashboard.types";
import { type PlanFeature } from "@/types/enums.types";

/**
 * The first three things to do, shown above the figures until they are done.
 *
 * A new agency's dashboard is all zeros, and nothing on it says that a sale
 * needs a customer or that a payment needs an account to land in. This says it,
 * then gets out of the way for good.
 */
const SetupChecklist = ({
  setup,
  features,
}: {
  setup: ISetupProgress;
  features: PlanFeature[];
}) => {
  const steps = buildSetupSteps(setup, features);
  if (steps.length === 0 || isSetupComplete(steps)) return null;

  const done = steps.filter((step) => step.done).length;

  // A white card with a blue edge: on the blue page ground a tinted card would
  // melt into it.
  return (
    <Card className="border-primary/40 bg-card">
      <CardHeader>
        <CardTitle className="text-base">Finish setting up your workspace</CardTitle>
        <CardDescription>
          {done === 0
            ? "Three short steps, and the figures on this page start filling in."
            : `${done} of ${steps.length} done — nearly there.`}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <ol className="space-y-2">
          {steps.map((step, index) => (
            <li
              key={step.key}
              className={cn(
                "flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border p-3",
                step.done ? "border-transparent bg-muted/40" : "bg-card",
              )}
            >
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                  step.done ? "bg-success/15 text-success" : "bg-primary/10 text-primary",
                )}
                aria-hidden="true"
              >
                {step.done ? <Check className="size-3.5" /> : index + 1}
              </span>

              <div className="min-w-0 flex-1">
                <p className={cn("text-sm font-medium", step.done && "text-muted-foreground")}>
                  {step.title}
                  {step.done && <span className="sr-only"> — done</span>}
                </p>
                {!step.done && (
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                )}
              </div>

              {!step.done && (
                <Button asChild size="sm" variant="outline" className="shrink-0">
                  <Link href={step.href}>
                    {step.action}
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Link>
                </Button>
              )}
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
};

export default SetupChecklist;
