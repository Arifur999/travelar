import type { Metadata } from "next";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import EmployeePayoutsTable from "@/components/modules/Employees/EmployeePayoutsTable";
import PageHeader from "@/components/shared/PageHeader";
import { buildQueryString, type PageSearchParams } from "@/lib/queryString";
import { getCashAccounts } from "@/services/account.services";
import { getUserInfo } from "@/services/auth.services";
import { getEmployeeDashboard, getEmployeeTransactions } from "@/services/employee.services";

export const metadata: Metadata = { title: "Employee transactions" };

const EmployeeTransactionsPage = async ({ searchParams }: { searchParams: PageSearchParams }) => {
  const queryString = buildQueryString(await searchParams);

  const queryClient = new QueryClient();

  const [userInfo] = await Promise.all([
    getUserInfo(),
    queryClient.prefetchQuery({
      queryKey: ["employee-payouts", queryString],
      queryFn: () => getEmployeeTransactions(queryString),
    }),
    // Both feed the Pay form: who is being paid, and out of which account.
    queryClient.prefetchQuery({
      queryKey: ["employee-dashboard"],
      queryFn: () => getEmployeeDashboard(),
    }),
    queryClient.prefetchQuery({
      queryKey: ["cash-accounts"],
      queryFn: () => getCashAccounts(),
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee transactions"
        description="Salary and bonus payments. Each one takes money out of an account, so reversing a payment puts it back."
      />

      <HydrationBoundary state={dehydrate(queryClient)}>
        <EmployeePayoutsTable
          initialQueryString={queryString}
          isAdmin={userInfo?.role === "AGENCY_ADMIN"}
        />
      </HydrationBoundary>
    </div>
  );
};

export default EmployeeTransactionsPage;
