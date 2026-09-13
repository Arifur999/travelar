"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Banknote, CalendarCheck, Plus, UserCheck, Users } from "lucide-react";
import { toast } from "sonner";
import {
  deleteAttendanceAction,
  deleteEmployeeAction,
  deletePayoutAction,
} from "@/app/(dashboardLayout)/dashboard/employees/_action";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import StatsCard from "@/components/shared/StatsCard";
import DataTable from "@/components/shared/table/DataTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRowActionModalState } from "@/hooks/useRowActionModalState";
import { useServerManagedDataTable } from "@/hooks/useServerManagedDataTable";
import { useServerManagedDataTableSearch } from "@/hooks/useServerManagedDataTableSearch";
import { formatCurrency, formatNumber, toNumber } from "@/lib/format";
import {
  getAttendance,
  getAttendanceSummary,
  getEmployeeDashboard,
  getEmployees,
  getEmployeeTransactions,
} from "@/services/employee.services";
import {
  type IEmployee,
  type IEmployeeAttendance,
  type IEmployeeTransaction,
} from "@/types/employee.types";
import AttendanceFormModal from "./AttendanceFormModal";
import EmployeeFormModal from "./EmployeeFormModal";
import PayoutFormModal from "./PayoutFormModal";
import {
  attendanceColumns,
  employeesColumns,
  payoutColumns,
} from "./employeeColumns";

interface EmployeesPanelProps {
  initialQueryString: string;
  /** Reversing a posted payout is AGENCY_ADMIN on the API. */
  isAdmin: boolean;
}

/**
 * Three lists on one page. The employee list owns the URL params; payouts and
 * attendance use local page state, since sharing one set of params would make
 * paging any one of them page all three.
 */
const EmployeesPanel = ({ initialQueryString, isAdmin }: EmployeesPanelProps) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isEmployeeOpen, setIsEmployeeOpen] = useState(false);
  const [isPayoutOpen, setIsPayoutOpen] = useState(false);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [payoutPage, setPayoutPage] = useState(0);
  const [attendancePage, setAttendancePage] = useState(0);

  const {
    searchParams,
    queryStringFromUrl,
    optimisticSortingState,
    optimisticPaginationState,
    isRouteRefreshPending,
    updateParams,
    handleSortingChange,
    handlePaginationChange,
  } = useServerManagedDataTable();

  const { searchTermFromUrl, handleDebouncedSearchChange } = useServerManagedDataTableSearch({
    searchParams,
    updateParams,
  });

  const employeeActions = useRowActionModalState<IEmployee>({ enableView: false });
  const payoutActions = useRowActionModalState<IEmployeeTransaction>({
    enableView: false,
    enableEdit: false,
    enableDelete: isAdmin,
  });
  const attendanceActions = useRowActionModalState<IEmployeeAttendance>({
    enableView: false,
    enableEdit: false,
  });

  const effectiveQueryString = queryStringFromUrl || initialQueryString;

  const { data: employeesData, isFetching } = useQuery({
    queryKey: ["employees", effectiveQueryString],
    queryFn: () => getEmployees(effectiveQueryString),
  });

  const { data: dashboardData } = useQuery({
    queryKey: ["employee-dashboard"],
    queryFn: () => getEmployeeDashboard(),
  });

  const payoutQuery = `page=${payoutPage + 1}&limit=10`;
  const { data: payoutsData, isFetching: isFetchingPayouts } = useQuery({
    queryKey: ["employee-payouts", payoutQuery],
    queryFn: () => getEmployeeTransactions(payoutQuery),
  });

  const attendanceQuery = `page=${attendancePage + 1}&limit=10`;
  const { data: attendanceData, isFetching: isFetchingAttendance } = useQuery({
    queryKey: ["attendance", attendanceQuery],
    queryFn: () => getAttendance(attendanceQuery),
  });

  const { data: attendanceSummaryData } = useQuery({
    queryKey: ["attendance-summary"],
    queryFn: () => getAttendanceSummary(),
  });

  const { mutateAsync: runDeleteEmployee, isPending: isDeletingEmployee } = useMutation({
    mutationFn: (id: string) => deleteEmployeeAction(id),
  });
  const { mutateAsync: runDeletePayout, isPending: isDeletingPayout } = useMutation({
    mutationFn: (id: string) => deletePayoutAction(id),
  });
  const { mutateAsync: runDeleteAttendance, isPending: isDeletingAttendance } = useMutation({
    mutationFn: (id: string) => deleteAttendanceAction(id),
  });

  const handleDeleteEmployee = async () => {
    const item = employeeActions.deletingItem;
    if (!item) return;

    const result = await runDeleteEmployee(item.id);
    if (!result.success) {
      toast.error(result.message || "Failed to delete employee");
      return;
    }

    toast.success(result.message || "Employee deleted");
    employeeActions.onDeleteOpenChange(false);
    void queryClient.invalidateQueries({ queryKey: ["employees"] });
    void queryClient.invalidateQueries({ queryKey: ["employee-dashboard"] });
    router.refresh();
  };

  const handleDeletePayout = async () => {
    const item = payoutActions.deletingItem;
    if (!item) return;

    const result = await runDeletePayout(item.id);
    if (!result.success) {
      toast.error(result.message || "Failed to delete payout");
      return;
    }

    toast.success(result.message || "Payout reversed");
    payoutActions.onDeleteOpenChange(false);
    void queryClient.invalidateQueries({ queryKey: ["employee-payouts"] });
    void queryClient.invalidateQueries({ queryKey: ["employees"] });
    void queryClient.invalidateQueries({ queryKey: ["employee-dashboard"] });
    void queryClient.invalidateQueries({ queryKey: ["cash-accounts"] });
    void queryClient.invalidateQueries({ queryKey: ["accounts-overview"] });
    router.refresh();
  };

  const handleDeleteAttendance = async () => {
    const item = attendanceActions.deletingItem;
    if (!item) return;

    const result = await runDeleteAttendance(item.id);
    if (!result.success) {
      toast.error(result.message || "Failed to delete entry");
      return;
    }

    toast.success(result.message || "Entry deleted");
    attendanceActions.onDeleteOpenChange(false);
    void queryClient.invalidateQueries({ queryKey: ["attendance"] });
    void queryClient.invalidateQueries({ queryKey: ["attendance-summary"] });
    router.refresh();
  };

  const summary = dashboardData?.data.summary;
  const payoutSummary = payoutsData?.data.summary;
  const attendanceSummary = attendanceSummaryData?.data;

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Active staff"
          value={formatNumber(summary?.activeCount ?? 0)}
          icon={Users}
          accent="primary"
          hint={
            summary?.resignedCount
              ? `${formatNumber(summary.resignedCount)} resigned`
              : "Nobody has resigned"
          }
        />
        <StatsCard
          title="Salary paid"
          value={formatCurrency(summary?.totalSalary ?? 0)}
          icon={Banknote}
          accent="expense"
        />
        <StatsCard
          title="Bonus paid"
          value={formatCurrency(summary?.totalBonus ?? 0)}
          icon={Banknote}
          accent="ledger"
        />
        <StatsCard
          title="Attendance"
          value={`${formatNumber(attendanceSummary?.presentCount ?? 0)} present`}
          icon={CalendarCheck}
          accent="success"
          hint={
            attendanceSummary
              ? `${formatNumber(attendanceSummary.absentCount)} absent across ${formatNumber(attendanceSummary.daysRecorded)} days`
              : undefined
          }
        />
      </div>

      <DataTable<IEmployee>
        data={employeesData?.data.employees ?? []}
        columns={employeesColumns}
        actions={employeeActions.tableActions}
        meta={employeesData?.meta}
        isLoading={isFetching || isRouteRefreshPending}
        emptyMessage="No employees yet."
        search={{
          initialValue: searchTermFromUrl,
          placeholder: "Search name, phone, address",
          onDebouncedChange: handleDebouncedSearchChange,
        }}
        sorting={{
          state: optimisticSortingState,
          onSortingChange: handleSortingChange,
        }}
        pagination={{
          state: optimisticPaginationState,
          onPaginationChange: handlePaginationChange,
        }}
        toolbarAction={
          <Button type="button" onClick={() => setIsEmployeeOpen(true)}>
            <Plus className="size-4" aria-hidden="true" />
            Add employee
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle>Payouts</CardTitle>
              <CardDescription>
                {payoutSummary
                  ? `${formatCurrency(payoutSummary.subtotal)} paid in total`
                  : "Salary and bonus payments."}
              </CardDescription>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setIsPayoutOpen(true)}
            >
              <Plus className="size-4" aria-hidden="true" />
              Pay
            </Button>
          </CardHeader>
          <CardContent>
            <DataTable<IEmployeeTransaction>
              data={payoutsData?.data.transactions ?? []}
              columns={payoutColumns}
              actions={payoutActions.tableActions}
              meta={payoutsData?.meta}
              isLoading={isFetchingPayouts}
              emptyMessage="No payouts yet."
              pagination={{
                // Local — the employee list above owns the URL params.
                state: { pageIndex: payoutPage, pageSize: 10 },
                onPaginationChange: (next) => setPayoutPage(next.pageIndex),
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle>Attendance</CardTitle>
              <CardDescription>One entry per employee per day.</CardDescription>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setIsAttendanceOpen(true)}
            >
              <UserCheck className="size-4" aria-hidden="true" />
              Record
            </Button>
          </CardHeader>
          <CardContent>
            <DataTable<IEmployeeAttendance>
              data={attendanceData?.data ?? []}
              columns={attendanceColumns}
              actions={attendanceActions.tableActions}
              meta={attendanceData?.meta}
              isLoading={isFetchingAttendance}
              emptyMessage="No attendance recorded yet."
              pagination={{
                state: { pageIndex: attendancePage, pageSize: 10 },
                onPaginationChange: (next) => setAttendancePage(next.pageIndex),
              }}
            />
          </CardContent>
        </Card>
      </div>

      <EmployeeFormModal open={isEmployeeOpen} onOpenChange={setIsEmployeeOpen} />
      {employeeActions.editingItem && (
        <EmployeeFormModal
          key={employeeActions.editingItem.id}
          open={employeeActions.isEditModalOpen}
          onOpenChange={employeeActions.onEditOpenChange}
          employee={employeeActions.editingItem}
        />
      )}

      <PayoutFormModal open={isPayoutOpen} onOpenChange={setIsPayoutOpen} />
      <AttendanceFormModal open={isAttendanceOpen} onOpenChange={setIsAttendanceOpen} />

      <ConfirmDialog
        open={employeeActions.isDeleteDialogOpen}
        onOpenChange={employeeActions.onDeleteOpenChange}
        onConfirm={handleDeleteEmployee}
        isPending={isDeletingEmployee}
        title="Delete this employee?"
        description={
          <>
            <span className="font-medium text-foreground">
              {employeeActions.deletingItem?.name}
            </span>{" "}
            will be removed. The delete is refused while payouts still reference them — set a
            resign date instead to keep the history.
          </>
        }
      />

      <ConfirmDialog
        open={payoutActions.isDeleteDialogOpen}
        onOpenChange={payoutActions.onDeleteOpenChange}
        onConfirm={handleDeletePayout}
        isPending={isDeletingPayout}
        title="Reverse this payout?"
        confirmLabel="Reverse"
        pendingLabel="Reversing..."
        description={
          <>
            {payoutActions.deletingItem && (
              <>
                <span className="font-medium text-foreground">
                  {formatCurrency(toNumber(payoutActions.deletingItem.amount))}
                </span>{" "}
                to {payoutActions.deletingItem.employee.name}.{" "}
              </>
            )}
            The posting is deleted, so the account goes back up.
          </>
        }
      />

      <ConfirmDialog
        open={attendanceActions.isDeleteDialogOpen}
        onOpenChange={attendanceActions.onDeleteOpenChange}
        onConfirm={handleDeleteAttendance}
        isPending={isDeletingAttendance}
        title="Delete this entry?"
        description="The day will be free to record again."
      />
    </>
  );
};

export default EmployeesPanel;
