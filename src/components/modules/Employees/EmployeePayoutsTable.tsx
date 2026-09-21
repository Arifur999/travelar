"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { deletePayoutAction } from "@/app/(dashboardLayout)/dashboard/employees/_action";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import DataTable from "@/components/shared/table/DataTable";
import { Button } from "@/components/ui/button";
import { useRowActionModalState } from "@/hooks/useRowActionModalState";
import { useServerManagedDataTable } from "@/hooks/useServerManagedDataTable";
import { formatCurrency, toNumber } from "@/lib/format";
import { getEmployeeTransactions } from "@/services/employee.services";
import { type IEmployeeTransaction } from "@/types/employee.types";
import PayoutFormModal from "./PayoutFormModal";
import { payoutColumns } from "./employeeColumns";

/** Salary and bonus payments. Reversing one is AGENCY_ADMIN on the API. */
const EmployeePayoutsTable = ({
  initialQueryString,
  isAdmin,
}: {
  initialQueryString: string;
  isAdmin: boolean;
}) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isPayoutOpen, setIsPayoutOpen] = useState(false);

  const {
    queryStringFromUrl,
    optimisticSortingState,
    optimisticPaginationState,
    isRouteRefreshPending,
    handleSortingChange,
    handlePaginationChange,
  } = useServerManagedDataTable();

  const actions = useRowActionModalState<IEmployeeTransaction>({
    enableView: false,
    enableEdit: false,
    enableDelete: isAdmin,
  });

  const effectiveQueryString = queryStringFromUrl || initialQueryString;

  const { data, isFetching } = useQuery({
    queryKey: ["employee-payouts", effectiveQueryString],
    queryFn: () => getEmployeeTransactions(effectiveQueryString),
  });

  const { mutateAsync: runDelete, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => deletePayoutAction(id),
  });

  const handleConfirmDelete = async () => {
    const item = actions.deletingItem;
    if (!item) return;

    const result = await runDelete(item.id);
    if (!result.success) {
      toast.error(result.message || "Failed to delete payout");
      return;
    }

    toast.success(result.message || "Payout reversed");
    actions.onDeleteOpenChange(false);
    void queryClient.invalidateQueries({ queryKey: ["employee-payouts"] });
    void queryClient.invalidateQueries({ queryKey: ["employees"] });
    void queryClient.invalidateQueries({ queryKey: ["employee-dashboard"] });
    void queryClient.invalidateQueries({ queryKey: ["cash-accounts"] });
    void queryClient.invalidateQueries({ queryKey: ["accounts-overview"] });
    void queryClient.refetchQueries({ queryKey: ["employee-payouts"], type: "active" });
    router.refresh();
  };

  const summary = data?.data.summary;

  return (
    <>
      <DataTable<IEmployeeTransaction>
        data={data?.data.transactions ?? []}
        columns={payoutColumns}
        actions={actions.tableActions}
        meta={data?.meta}
        isLoading={isFetching || isRouteRefreshPending}
        emptyMessage="No payouts yet."
        sorting={{
          state: optimisticSortingState,
          onSortingChange: handleSortingChange,
        }}
        pagination={{
          state: optimisticPaginationState,
          onPaginationChange: handlePaginationChange,
        }}
        toolbarAction={
          <div className="flex items-center gap-3">
            {summary && (
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {formatCurrency(summary.subtotal)} paid in total
              </span>
            )}
            <Button type="button" onClick={() => setIsPayoutOpen(true)}>
              <Plus className="size-4" aria-hidden="true" />
              Pay
            </Button>
          </div>
        }
      />

      <PayoutFormModal open={isPayoutOpen} onOpenChange={setIsPayoutOpen} />

      <ConfirmDialog
        open={actions.isDeleteDialogOpen}
        onOpenChange={actions.onDeleteOpenChange}
        onConfirm={handleConfirmDelete}
        isPending={isDeleting}
        title="Reverse this payout?"
        confirmLabel="Reverse"
        pendingLabel="Reversing..."
        description={
          <>
            {actions.deletingItem && (
              <>
                <span className="font-medium text-foreground">
                  {formatCurrency(toNumber(actions.deletingItem.amount))}
                </span>{" "}
                to {actions.deletingItem.employee.name}.{" "}
              </>
            )}
            The posting is deleted, so the account goes back up.
          </>
        }
      />
    </>
  );
};

export default EmployeePayoutsTable;
