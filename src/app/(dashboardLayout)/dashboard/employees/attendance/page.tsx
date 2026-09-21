import type { Metadata } from "next";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import EmployeeAttendanceTable from "@/components/modules/Employees/EmployeeAttendanceTable";
import PageHeader from "@/components/shared/PageHeader";
import { buildQueryString, type PageSearchParams } from "@/lib/queryString";
import { getAttendance, getEmployeeDashboard } from "@/services/employee.services";

export const metadata: Metadata = { title: "Attendance" };

const AttendancePage = async ({ searchParams }: { searchParams: PageSearchParams }) => {
  const queryString = buildQueryString(await searchParams);

  const queryClient = new QueryClient();

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ["attendance", queryString],
      queryFn: () => getAttendance(queryString),
    }),
    // The record form needs someone to record against.
    queryClient.prefetchQuery({
      queryKey: ["employee-dashboard"],
      queryFn: () => getEmployeeDashboard(),
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        description="One entry per employee per day. Deleting an entry frees that day to be recorded again."
      />

      <HydrationBoundary state={dehydrate(queryClient)}>
        <EmployeeAttendanceTable initialQueryString={queryString} />
      </HydrationBoundary>
    </div>
  );
};

export default AttendancePage;
