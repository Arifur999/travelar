"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteCategoryAction } from "@/app/(dashboardLayout)/dashboard/expenses/_action";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import Loader from "@/components/shared/Loader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getExpenseCategories, getExpenseDashboard } from "@/services/expense.services";
import { type IExpenseCategory } from "@/types/expense.types";
import CategoryFormModal from "./CategoryFormModal";

/**
 * Categories with their spend and budget usage.
 *
 * The bar is capped at 100% width but the figure is not — going over budget
 * has to be visible as a number, and clamping the percentage would hide it.
 */
const CategoryBreakdown = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editing, setEditing] = useState<IExpenseCategory | null>(null);
  const [deleting, setDeleting] = useState<IExpenseCategory | null>(null);

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["expense-dashboard"],
    queryFn: () => getExpenseDashboard(),
  });

  // The breakdown carries spend and budgets but not the raw rows, so the edit
  // form needs the category list to populate from.
  const { data: categoriesData } = useQuery({
    queryKey: ["expense-categories"],
    queryFn: () => getExpenseCategories(),
  });

  const rows = dashboardData?.data.byCategory ?? [];
  const categories = categoriesData?.data ?? [];

  const { mutateAsync: runDelete, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => deleteCategoryAction(id),
  });

  const handleConfirmDelete = async () => {
    if (!deleting) return;

    const result = await runDelete(deleting.id);

    if (!result.success) {
      toast.error(result.message || "Failed to delete category");
      return;
    }

    toast.success(result.message || "Category deleted");
    setDeleting(null);
    void queryClient.invalidateQueries({ queryKey: ["expense-categories"] });
    void queryClient.invalidateQueries({ queryKey: ["expense-dashboard"] });
    router.refresh();
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle>Categories</CardTitle>
            <CardDescription>
              Spend per category, with this month against its budget.
            </CardDescription>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={() => setIsCreateOpen(true)}>
            <Plus className="size-4" aria-hidden="true" />
            Add category
          </Button>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex h-24 items-center justify-center">
              <Loader size={28} label="Loading categories" />
            </div>
          ) : rows.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No categories yet. Add one so expenses have somewhere to report.
            </p>
          ) : (
            <ul className="space-y-4">
              {rows.map((row) => {
                const category = categories.find((item) => item.id === row.id);
                const hasBudget = row.monthlyBudget > 0;
                const overBudget = hasBudget && row.percentUsedMonth > 100;

                return (
                  <li key={row.id} className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: row.color ?? "var(--muted-foreground)" }}
                        aria-hidden="true"
                      />
                      <span className="text-sm font-medium">{row.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatPercent(row.shareOfTotal)} of all spend
                      </span>

                      <span className="ml-auto text-sm font-medium tabular-nums">
                        {formatCurrency(row.total)}
                      </span>

                      {category && (
                        <span className="flex gap-0.5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-7 text-muted-foreground"
                            onClick={() => setEditing(category)}
                            aria-label={`Edit ${row.name}`}
                          >
                            <Pencil className="size-3.5" aria-hidden="true" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-7 text-muted-foreground hover:text-destructive"
                            onClick={() => setDeleting(category)}
                            aria-label={`Delete ${row.name}`}
                          >
                            <Trash2 className="size-3.5" aria-hidden="true" />
                          </Button>
                        </span>
                      )}
                    </div>

                    {hasBudget ? (
                      <>
                        <div
                          className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
                          role="progressbar"
                          aria-valuenow={Math.round(row.percentUsedMonth)}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${row.name} monthly budget used`}
                        >
                          <div
                            className={cn(
                              "h-full rounded-full",
                              overBudget ? "bg-destructive" : "bg-primary",
                            )}
                            // Width is clamped so the bar cannot overflow, but
                            // the percentage below is not.
                            style={{ width: `${Math.min(row.percentUsedMonth, 100)}%` }}
                          />
                        </div>
                        <p
                          className={cn(
                            "text-xs",
                            overBudget ? "text-destructive" : "text-muted-foreground",
                          )}
                        >
                          {formatCurrency(row.thisMonth)} of{" "}
                          {formatCurrency(row.monthlyBudget)} this month —{" "}
                          {formatPercent(row.percentUsedMonth)}
                          {overBudget && " over budget"}
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(row.thisMonth)} this month · no budget set
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <CategoryFormModal open={isCreateOpen} onOpenChange={setIsCreateOpen} />

      {editing && (
        <CategoryFormModal
          key={editing.id}
          open
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setEditing(null);
          }}
          category={editing}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setDeleting(null);
        }}
        onConfirm={handleConfirmDelete}
        isPending={isDeleting}
        title="Delete this category?"
        description={
          <>
            <span className="font-medium text-foreground">{deleting?.name}</span> will be
            removed. The delete is refused while any expense still reports under it.
          </>
        }
      />
    </>
  );
};

export default CategoryBreakdown;
