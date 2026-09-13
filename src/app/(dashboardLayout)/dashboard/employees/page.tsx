import type { Metadata } from "next";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import EmployeesPanel from "@/components/modules/Employees/EmployeesPanel";
import PageHeader from "@/components/shared/PageHeader";
import { buildQueryString, type PageSearchParams } from "@/lib/queryString";
import { getCashAccounts } from "@/services/account.services";
import { getUserInfo } from "@/services/auth.services";
import {
  getAttendance,
  getAttendanceSummary,
  getEmployeeDashboard,
  getEmployees,
  getEmployeeTransactions,
} from "@/services/employee.services";

export const metadata: Metadata = { title: "Employees" };

const EmployeesPage = async ({ searchParams }: { searchParams: PageSearchParams }) => {
  const queryString = buildQueryString(await searchParams);

  const queryClient = new QueryClient();

  const [userInfo] = await Promise.all([
    getUserInfo(),
    queryClient.prefetchQuery({
      queryKey: ["employees", queryString],
      queryFn: () => getEmployees(queryString),
    }),
    queryClient.prefetchQuery({
      queryKey: ["employee-dashboard"],
      queryFn: () => getEmployeeDashboard(),
    }),
    queryClient.prefetchQuery({
      queryKey: ["employee-payouts", "page=1&limit=10"],
      queryFn: () => getEmployeeTransactions("page=1&limit=10"),
    }),
    queryClient.prefetchQuery({
      queryKey: ["attendance", "page=1&limit=10"],
      queryFn: () => getAttendance("page=1&limit=10"),
    }),
    queryClient.prefetchQuery({
      queryKey: ["attendance-summary"],
      queryFn: () => getAttendanceSummary(),
    }),
    queryClient.prefetchQuery({
      queryKey: ["cash-accounts"],
      queryFn: () => getCashAccounts(),
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        description="Staff, their payouts and attendance. Whether someone still works here is decided by whether they have a resign date — there is no separate flag."
      />

      <HydrationBoundary state={dehydrate(queryClient)}>
        <EmployeesPanel
          initialQueryString={queryString}
          isAdmin={userInfo?.role === "AGENCY_ADMIN"}
        />
      </HydrationBoundary>
    </div>
  );
};

export default EmployeesPage;
