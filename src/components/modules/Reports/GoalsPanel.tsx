"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Target } from "lucide-react";
import { toast } from "sonner";
import { upsertGoalAction } from "@/app/(dashboardLayout)/dashboard/goals/_action";
import Loader from "@/components/shared/Loader";
import AppField from "@/components/shared/form/AppField";
import AppSubmitButton from "@/components/shared/form/AppSubmitButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, toNumber } from "@/lib/format";
import { getGoals, getYearlyDashboard } from "@/services/dashboard.services";
import { MONTH_NAMES } from "@/types/dashboard.types";
import {
  goalFieldsZodSchema,
  type IGoalFormValues,
} from "@/zod/dashboard.validation";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, index) => CURRENT_YEAR - 4 + index);

interface GoalsPanelProps {
  /** Setting a goal is AGENCY_ADMIN on the API; staff see the table read-only. */
  canEdit: boolean;
}

const GoalsPanel = ({ canEdit }: GoalsPanelProps) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [year, setYear] = useState(CURRENT_YEAR);

  const { data: goalsData, isLoading } = useQuery({
    queryKey: ["goals", year],
    queryFn: () => getGoals(year),
  });

  // The yearly view carries actuals per month, which is what makes a goal
  // table useful rather than a list of numbers with nothing to compare to.
  const { data: yearlyData } = useQuery({
    queryKey: ["dashboard-yearly", year],
    queryFn: () => getYearlyDashboard(year),
  });

  const goals = goalsData?.data ?? [];
  const months = yearlyData?.data.months ?? [];

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (values: IGoalFormValues) => upsertGoalAction(values),
  });

  const defaultValues: IGoalFormValues = {
    year: String(CURRENT_YEAR),
    month: String(new Date().getMonth() + 1),
    salesGoal: "",
    profitGoal: "",
  };

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      const result = await mutateAsync(value);

      if (!result.success) {
        toast.error(result.message || "Failed to save the goal");
        return;
      }

      toast.success(result.message || "Goal saved");
      form.reset();
      void queryClient.invalidateQueries({ queryKey: ["goals"] });
      // Goals feed every overview, so all three scopes are stale.
      void queryClient.invalidateQueries({ queryKey: ["dashboard-monthly"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard-yearly"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard-custom"] });
      void queryClient.refetchQueries({ queryKey: ["goals"], type: "active" });
      router.refresh();
    },
  });

  const goalFor = (month: number) => goals.find((goal) => goal.month === month);
  const actualFor = (month: number) => months.find((row) => row.month === month);

  return (
    <div className="space-y-6">
      {canEdit && (
        <Card>
          <CardHeader>
            <CardTitle>Set a goal</CardTitle>
            <CardDescription>
              Saving the same month again updates it rather than adding a second one.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              method="POST"
              action="#"
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                event.stopPropagation();
                form.handleSubmit();
              }}
              className="flex flex-wrap items-end gap-3"
            >
              <form.Field name="year">
                {(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor={field.name}>Year</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={field.handleChange}
                      disabled={isPending}
                    >
                      <SelectTrigger id={field.name} className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {YEARS.map((option) => (
                          <SelectItem key={option} value={String(option)}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </form.Field>

              <form.Field name="month">
                {(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor={field.name}>Month</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={field.handleChange}
                      disabled={isPending}
                    >
                      <SelectTrigger id={field.name} className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTH_NAMES.map((name, index) => (
                          <SelectItem key={name} value={String(index + 1)}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </form.Field>

              <form.Field
                name="salesGoal"
                validators={{ onChange: goalFieldsZodSchema.shape.salesGoal }}
              >
                {(field) => (
                  <div className="w-40">
                    <AppField
                      field={field}
                      label="Sales goal"
                      placeholder="0.00"
                      disabled={isPending}
                      prepend={<span className="text-sm">৳</span>}
                    />
                  </div>
                )}
              </form.Field>

              <form.Field
                name="profitGoal"
                validators={{ onChange: goalFieldsZodSchema.shape.profitGoal }}
              >
                {(field) => (
                  <div className="w-40">
                    <AppField
                      field={field}
                      label="Profit goal"
                      placeholder="0.00"
                      disabled={isPending}
                      prepend={<span className="text-sm">৳</span>}
                    />
                  </div>
                )}
              </form.Field>

              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting] as const}
              >
                {([canSubmit, isSubmitting]) => (
                  <AppSubmitButton
                    isPending={isSubmitting || isPending}
                    pendingLabel="Saving..."
                    disabled={!canSubmit}
                    className="w-auto"
                  >
                    <Target className="size-4" aria-hidden="true" />
                    Save goal
                  </AppSubmitButton>
                )}
              </form.Subscribe>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle>Goals for {year}</CardTitle>
            <CardDescription>
              {canEdit
                ? "Each month's target against what actually happened."
                : "Each month's target against what actually happened. Only an agency admin can change these."}
            </CardDescription>
          </div>
          <Select value={String(year)} onValueChange={(next) => setYear(Number(next))}>
            <SelectTrigger className="w-28" aria-label="Goal year">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex h-24 items-center justify-center">
              <Loader size={28} label="Loading goals" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-3 py-2 text-left font-medium">Month</th>
                    <th className="px-3 py-2 text-right font-medium">Sales goal</th>
                    <th className="px-3 py-2 text-right font-medium">Actual sales</th>
                    <th className="px-3 py-2 text-right font-medium">Profit goal</th>
                    <th className="px-3 py-2 text-right font-medium">Actual profit</th>
                  </tr>
                </thead>
                <tbody>
                  {MONTH_NAMES.map((name, index) => {
                    const month = index + 1;
                    const goal = goalFor(month);
                    const actual = actualFor(month);
                    const salesGoal = toNumber(goal?.salesGoal);
                    const profitGoal = toNumber(goal?.profitGoal);

                    return (
                      <tr key={name} className="border-b last:border-0">
                        <td className="px-3 py-2 whitespace-nowrap">{name}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                          {/* No goal is "—", not 0 — the two mean different things. */}
                          {salesGoal > 0 ? formatCurrency(salesGoal) : "—"}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {actual ? formatCurrency(actual.actualSales) : "—"}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                          {profitGoal > 0 ? formatCurrency(profitGoal) : "—"}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {actual ? formatCurrency(actual.actualProfit) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GoalsPanel;
