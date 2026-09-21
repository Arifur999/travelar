import type { Metadata } from "next";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import EmployeesTable from "@/components/modules/Employees/EmployeesTable";
import PageHeader from "@/components/shared/PageHeader";
import { buildQueryString, type PageSearchParams } from "@/lib/queryString";
import { getEmployees } from "@/services/employee.services";

export const metadata: Metadata = { title: "Employees list" };

const EmployeesListPage = async ({ searchParams }: { searchParams: PageSearchParams }) => {
  const queryString = buildQueryString(await searchParams);

  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["employees", queryString],
    queryFn: () => getEmployees(queryString),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees list"
        description="Everyone on staff, with what they have been paid. Someone who has left keeps their history — give them a resign date rather than deleting them."
      />

      <HydrationBoundary state={dehydrate(queryClient)}>
        <EmployeesTable initialQueryString={queryString} />
      </HydrationBoundary>
    </div>
  );
};

export default EmployeesListPage;
