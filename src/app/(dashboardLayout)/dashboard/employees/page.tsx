import type { Metadata } from "next";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import EmployeeSummaryCards from "@/components/modules/Employees/EmployeeSummaryCards";
import PayrollCharts from "@/components/modules/Employees/PayrollCharts";
import RecentPayouts, {
  RECENT_PAYOUTS_QUERY,
} from "@/components/modules/Employees/RecentPayouts";
import PageHeader from "@/components/shared/PageHeader";
import {
  getAttendanceSummary,
  getEmployeeDashboard,
  getEmployeeTransactions,
} from "@/services/employee.services";

export const metadata: Metadata = { title: "Employees" };

/** The section's landing page: headcount, what has been paid, who was in. */
const EmployeesDashboardPage = async () => {
  const queryClient = new QueryClient();

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ["employee-dashboard"],
      queryFn: () => getEmployeeDashboard(),
    }),
    queryClient.prefetchQuery({
      queryKey: ["attendance-summary"],
      queryFn: () => getAttendanceSummary(),
    }),
    queryClient.prefetchQuery({
      queryKey: ["employee-payouts", RECENT_PAYOUTS_QUERY],
      queryFn: () => getEmployeeTransactions(RECENT_PAYOUTS_QUERY),
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        description="Staff, their payouts and attendance. Whether someone still works here is decided by whether they have a resign date — there is no separate flag."
      />

      <HydrationBoundary state={dehydrate(queryClient)}>
        <EmployeeSummaryCards />
        <PayrollCharts />
        <RecentPayouts />
      </HydrationBoundary>
    </div>
  );
};

export default EmployeesDashboardPage;
