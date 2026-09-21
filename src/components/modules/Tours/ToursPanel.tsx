"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { deleteTourAction } from "@/app/(dashboardLayout)/dashboard/tours/_action";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import DataTable from "@/components/shared/table/DataTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRowActionModalState } from "@/hooks/useRowActionModalState";
import { getTours } from "@/services/tour.services";
import { type ITourPackage } from "@/types/tour.types";
import TourFormModal from "./TourFormModal";
import { toursColumns } from "./tourColumns";

/**
 * The tours themselves, below the bookings.
 *
 * A small list sorted client-side — giving it its own URL params would fight
 * with the bookings table above, which owns them.
 */
const ToursPanel = ({ isAdmin }: { isAdmin: boolean }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const tourActions = useRowActionModalState<ITourPackage>({
    enableView: false,
    enableDelete: isAdmin,
  });

  const { data, isFetching } = useQuery({
    queryKey: ["tours"],
    queryFn: () => getTours("limit=200"),
  });

  const { mutateAsync: runDelete, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => deleteTourAction(id),
  });

  const handleDelete = async () => {
    const item = tourActions.deletingItem;
    if (!item) return;

    const result = await runDelete(item.id);
    if (!result.success) {
      // "This tour has bookings and cannot be deleted" comes from the API.
      toast.error(result.message || "Failed to delete tour");
      return;
    }

    toast.success(result.message || "Tour deleted");
    tourActions.onDeleteOpenChange(false);
    void queryClient.invalidateQueries({ queryKey: ["tours"] });
    void queryClient.invalidateQueries({ queryKey: ["tour-summary"] });
    router.refresh();
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle>Tours</CardTitle>
            <CardDescription>
              Each one is a dated trip with its own seats and price. Seats are counted from live
              bookings, so a cancellation frees them straight away.
            </CardDescription>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={() => setIsCreateOpen(true)}>
            <Plus className="size-4" aria-hidden="true" />
            Add tour
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable<ITourPackage>
            data={data?.data ?? []}
            columns={toursColumns}
            actions={tourActions.tableActions}
            isLoading={isFetching}
            emptyMessage="No tours yet. Add one and you can start selling seats on it."
          />
        </CardContent>
      </Card>

      <TourFormModal open={isCreateOpen} onOpenChange={setIsCreateOpen} />
      {tourActions.editingItem && (
        <TourFormModal
          key={tourActions.editingItem.id}
          open={tourActions.isEditModalOpen}
          onOpenChange={tourActions.onEditOpenChange}
          tour={tourActions.editingItem}
        />
      )}

      <ConfirmDialog
        open={tourActions.isDeleteDialogOpen}
        onOpenChange={tourActions.onDeleteOpenChange}
        onConfirm={handleDelete}
        isPending={isDeleting}
        title="Delete this tour?"
        description={
          <>
            <span className="font-medium text-foreground">{tourActions.deletingItem?.name}</span>{" "}
            will be removed. The delete is refused while anyone is booked on it — close the tour
            instead to stop selling seats.
          </>
        }
      />
    </>
  );
};

export default ToursPanel;
