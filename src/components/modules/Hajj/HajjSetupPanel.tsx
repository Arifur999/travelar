"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { RiAddLine } from "@remixicon/react";
import { toast } from "sonner";
import {
  deleteHajjBatchAction,
  deleteHajjPackageAction,
} from "@/app/(dashboardLayout)/dashboard/hajj/_action";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import DataTable from "@/components/shared/table/DataTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRowActionModalState } from "@/hooks/useRowActionModalState";
import { getHajjBatches, getHajjPackages } from "@/services/hajj.services";
import { type IHajjBatch, type IHajjPackage } from "@/types/hajj.types";
import HajjBatchFormModal from "./HajjBatchFormModal";
import HajjPackageFormModal from "./HajjPackageFormModal";
import HajjRoomsDialog from "./HajjRoomsDialog";
import { hajjBatchesColumns, hajjPackagesColumns } from "./hajjColumns";

/**
 * Packages and batches, below the bookings.
 *
 * Both are small lists sorted client-side — giving either its own URL params
 * would fight with the bookings table above, which owns them.
 */
const HajjSetupPanel = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isPackageOpen, setIsPackageOpen] = useState(false);
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [roomsBatch, setRoomsBatch] = useState<IHajjBatch | null>(null);

  const packageActions = useRowActionModalState<IHajjPackage>({ enableView: false });
  // "View" on a batch opens its rooms.
  const batchActions = useRowActionModalState<IHajjBatch>();

  const { data: packagesData, isFetching: isFetchingPackages } = useQuery({
    queryKey: ["hajj-packages"],
    queryFn: () => getHajjPackages("limit=200"),
  });

  const { data: batchesData, isFetching: isFetchingBatches } = useQuery({
    queryKey: ["hajj-batches"],
    queryFn: () => getHajjBatches("limit=200"),
  });

  const { mutateAsync: runDeletePackage, isPending: isDeletingPackage } = useMutation({
    mutationFn: (id: string) => deleteHajjPackageAction(id),
  });

  const { mutateAsync: runDeleteBatch, isPending: isDeletingBatch } = useMutation({
    mutationFn: (id: string) => deleteHajjBatchAction(id),
  });

  const handleDeletePackage = async () => {
    const item = packageActions.deletingItem;
    if (!item) return;

    const result = await runDeletePackage(item.id);
    if (!result.success) {
      toast.error(result.message || "Failed to delete package");
      return;
    }

    toast.success(result.message || "Package deleted");
    packageActions.onDeleteOpenChange(false);
    void queryClient.invalidateQueries({ queryKey: ["hajj-packages"] });
    router.refresh();
  };

  const handleDeleteBatch = async () => {
    const item = batchActions.deletingItem;
    if (!item) return;

    const result = await runDeleteBatch(item.id);
    if (!result.success) {
      toast.error(result.message || "Failed to delete batch");
      return;
    }

    toast.success(result.message || "Batch deleted");
    batchActions.onDeleteOpenChange(false);
    void queryClient.invalidateQueries({ queryKey: ["hajj-batches"] });
    router.refresh();
  };

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle>Packages</CardTitle>
              <CardDescription>What you sell, and at what price.</CardDescription>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setIsPackageOpen(true)}
            >
              <RiAddLine className="size-4" aria-hidden="true" />
              Add package
            </Button>
          </CardHeader>
          <CardContent>
            <DataTable<IHajjPackage>
              data={packagesData?.data ?? []}
              columns={hajjPackagesColumns}
              actions={packageActions.tableActions}
              isLoading={isFetchingPackages}
              emptyMessage="No packages yet."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle>Batches</CardTitle>
              <CardDescription>
                Departures. Open one to manage its hotel rooms.
              </CardDescription>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={() => setIsBatchOpen(true)}>
              <RiAddLine className="size-4" aria-hidden="true" />
              Add batch
            </Button>
          </CardHeader>
          <CardContent>
            <DataTable<IHajjBatch>
              data={batchesData?.data ?? []}
              columns={hajjBatchesColumns}
              actions={{
                ...batchActions.tableActions,
                onView: (batch) => setRoomsBatch(batch),
              }}
              isLoading={isFetchingBatches}
              emptyMessage="No batches yet."
            />
          </CardContent>
        </Card>
      </div>

      <HajjPackageFormModal open={isPackageOpen} onOpenChange={setIsPackageOpen} />
      {packageActions.editingItem && (
        <HajjPackageFormModal
          key={packageActions.editingItem.id}
          open={packageActions.isEditModalOpen}
          onOpenChange={packageActions.onEditOpenChange}
          hajjPackage={packageActions.editingItem}
        />
      )}

      <HajjBatchFormModal open={isBatchOpen} onOpenChange={setIsBatchOpen} />
      {batchActions.editingItem && (
        <HajjBatchFormModal
          key={batchActions.editingItem.id}
          open={batchActions.isEditModalOpen}
          onOpenChange={batchActions.onEditOpenChange}
          batch={batchActions.editingItem}
        />
      )}

      {roomsBatch && (
        <HajjRoomsDialog
          key={roomsBatch.id}
          open
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setRoomsBatch(null);
          }}
          batch={roomsBatch}
        />
      )}

      <ConfirmDialog
        open={packageActions.isDeleteDialogOpen}
        onOpenChange={packageActions.onDeleteOpenChange}
        onConfirm={handleDeletePackage}
        isPending={isDeletingPackage}
        title="Delete this package?"
        description={
          <>
            <span className="font-medium text-foreground">
              {packageActions.deletingItem?.name}
            </span>{" "}
            will be removed. The delete is refused while any batch or booking still references
            it — retire it instead to stop offering it.
          </>
        }
      />

      <ConfirmDialog
        open={batchActions.isDeleteDialogOpen}
        onOpenChange={batchActions.onDeleteOpenChange}
        onConfirm={handleDeleteBatch}
        isPending={isDeletingBatch}
        title="Delete this batch?"
        description={
          <>
            <span className="font-medium text-foreground">
              {batchActions.deletingItem?.name}
            </span>{" "}
            will be removed. The delete is refused while any booking is still on it.
          </>
        }
      />
    </>
  );
};

export default HajjSetupPanel;
