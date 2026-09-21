"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { UserCheck } from "lucide-react";
import { toast } from "sonner";
import { deleteAttendanceAction } from "@/app/(dashboardLayout)/dashboard/employees/_action";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import DataTable from "@/components/shared/table/DataTable";
import { Button } from "@/components/ui/button";
import { useRowActionModalState } from "@/hooks/useRowActionModalState";
import { useServerManagedDataTable } from "@/hooks/useServerManagedDataTable";
import { getAttendance } from "@/services/employee.services";
import { type IEmployeeAttendance } from "@/types/employee.types";
import AttendanceFormModal from "./AttendanceFormModal";
import { attendanceColumns } from "./employeeColumns";

/** One entry per employee per day. */
const EmployeeAttendanceTable = ({ initialQueryString }: { initialQueryString: string }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isRecordOpen, setIsRecordOpen] = useState(false);

  const {
    queryStringFromUrl,
    optimisticSortingState,
    optimisticPaginationState,
    isRouteRefreshPending,
    handleSortingChange,
    handlePaginationChange,
  } = useServerManagedDataTable();

  const actions = useRowActionModalState<IEmployeeAttendance>({
    enableView: false,
    enableEdit: false,
  });

  const effectiveQueryString = queryStringFromUrl || initialQueryString;

  const { data, isFetching } = useQuery({
    queryKey: ["attendance", effectiveQueryString],
    queryFn: () => getAttendance(effectiveQueryString),
  });

  const { mutateAsync: runDelete, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => deleteAttendanceAction(id),
  });

  const handleConfirmDelete = async () => {
    const item = actions.deletingItem;
    if (!item) return;

    const result = await runDelete(item.id);
    if (!result.success) {
      toast.error(result.message || "Failed to delete entry");
      return;
    }

    toast.success(result.message || "Entry deleted");
    actions.onDeleteOpenChange(false);
    void queryClient.invalidateQueries({ queryKey: ["attendance"] });
    void queryClient.invalidateQueries({ queryKey: ["attendance-summary"] });
    void queryClient.refetchQueries({ queryKey: ["attendance"], type: "active" });
    router.refresh();
  };

  return (
    <>
      <DataTable<IEmployeeAttendance>
        data={data?.data ?? []}
        columns={attendanceColumns}
        actions={actions.tableActions}
        meta={data?.meta}
        isLoading={isFetching || isRouteRefreshPending}
        emptyMessage="No attendance recorded yet."
        sorting={{
          state: optimisticSortingState,
          onSortingChange: handleSortingChange,
        }}
        pagination={{
          state: optimisticPaginationState,
          onPaginationChange: handlePaginationChange,
        }}
        toolbarAction={
          <Button type="button" onClick={() => setIsRecordOpen(true)}>
            <UserCheck className="size-4" aria-hidden="true" />
            Record
          </Button>
        }
      />

      <AttendanceFormModal open={isRecordOpen} onOpenChange={setIsRecordOpen} />

      <ConfirmDialog
        open={actions.isDeleteDialogOpen}
        onOpenChange={actions.onDeleteOpenChange}
        onConfirm={handleConfirmDelete}
        isPending={isDeleting}
        title="Delete this entry?"
        description="The day will be free to record again."
      />
    </>
  );
};

export default EmployeeAttendanceTable;
