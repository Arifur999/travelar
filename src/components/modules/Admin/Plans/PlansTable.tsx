"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { deactivatePlanAction } from "@/app/(dashboardLayout)/admin/dashboard/_action";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import MoneyCell from "@/components/shared/cell/MoneyCell";
import StatusBadge from "@/components/shared/cell/StatusBadge";
import DataTable from "@/components/shared/table/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRowActionModalState } from "@/hooks/useRowActionModalState";
import { formatNumber } from "@/lib/format";
import { type AppColumnDef } from "@/lib/table/features";
import { getAdminPlans } from "@/services/admin.services";
import { type IAdminPlan } from "@/types/admin.types";
import { PLAN_FEATURE_LABELS } from "@/types/enums.types";
import PlanFormModal from "./PlanFormModal";

const columns: AppColumnDef<IAdminPlan>[] = [
  {
    id: "name",
    accessorKey: "name",
    header: "Plan",
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{row.original.name}</p>
        {row.original.description && (
          <p className="truncate text-xs text-muted-foreground">{row.original.description}</p>
        )}
      </div>
    ),
  },
  {
    id: "price",
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => (
      <div>
        <MoneyCell value={row.original.price} />
        <p className="text-right text-xs text-muted-foreground">
          {formatNumber(row.original.durationDays)} days
        </p>
      </div>
    ),
  },
  {
    id: "features",
    header: "Modules",
    enableSorting: false,
    cell: ({ row }) =>
      row.original.features.length === 0 ? (
        <span className="text-xs text-muted-foreground">None</span>
      ) : (
        <div className="flex flex-wrap gap-1">
          {row.original.features.map((feature) => (
            <Badge key={feature} variant="secondary" className="text-xs">
              {PLAN_FEATURE_LABELS[feature]}
            </Badge>
          ))}
        </div>
      ),
  },
  {
    id: "isActive",
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) =>
      row.original.isActive ? (
        <StatusBadge label="On offer" tone="success" />
      ) : (
        <StatusBadge label="Withdrawn" tone="neutral" />
      ),
  },
];

/** Plans are a handful of rows, so this table sorts in memory. */
const PlansTable = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const {
    editingItem,
    deletingItem,
    isEditModalOpen,
    isDeleteDialogOpen,
    onEditOpenChange,
    onDeleteOpenChange,
    tableActions,
  } = useRowActionModalState<IAdminPlan>({ enableView: false });

  const { data, isFetching } = useQuery({
    queryKey: ["admin-plans"],
    queryFn: () => getAdminPlans(),
  });

  const { mutateAsync: runDeactivate, isPending: isDeactivating } = useMutation({
    mutationFn: (id: string) => deactivatePlanAction(id),
  });

  const handleConfirm = async () => {
    if (!deletingItem) return;

    const result = await runDeactivate(deletingItem.id);
    if (!result.success) {
      toast.error(result.message || "Failed to withdraw the plan");
      return;
    }

    toast.success(result.message || "Plan withdrawn");
    onDeleteOpenChange(false);
    void queryClient.invalidateQueries({ queryKey: ["admin-plans"] });
    void queryClient.invalidateQueries({ queryKey: ["billing-plans"] });
    router.refresh();
  };

  return (
    <>
      <DataTable<IAdminPlan>
        data={data?.data ?? []}
        columns={columns}
        actions={tableActions}
        isLoading={isFetching}
        emptyMessage="No plans yet."
        toolbarAction={
          <Button type="button" onClick={() => setIsCreateOpen(true)}>
            <Plus className="size-4" aria-hidden="true" />
            New plan
          </Button>
        }
      />

      <PlanFormModal open={isCreateOpen} onOpenChange={setIsCreateOpen} />

      {editingItem && (
        <PlanFormModal
          key={editingItem.id}
          open={isEditModalOpen}
          onOpenChange={onEditOpenChange}
          plan={editingItem}
        />
      )}

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={onDeleteOpenChange}
        onConfirm={handleConfirm}
        isPending={isDeactivating}
        title="Withdraw this plan?"
        confirmLabel="Withdraw"
        pendingLabel="Withdrawing..."
        destructive={false}
        description={
          <>
            <span className="font-medium text-foreground">{deletingItem?.name}</span> stops
            being on offer. Agencies already on it keep it — nothing is removed from them.
          </>
        }
      />
    </>
  );
};

export default PlansTable;
