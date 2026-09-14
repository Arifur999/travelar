import type { Metadata } from "next";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import AgenciesTable from "@/components/modules/Admin/Agencies/AgenciesTable";
import PageHeader from "@/components/shared/PageHeader";
import { buildQueryString, type PageSearchParams } from "@/lib/queryString";
import { getAdminPlans, getAgencies } from "@/services/admin.services";

export const metadata: Metadata = { title: "Agencies" };

const AgenciesPage = async ({ searchParams }: { searchParams: PageSearchParams }) => {
  const queryString = buildQueryString(await searchParams);

  const queryClient = new QueryClient();

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ["admin-agencies", queryString],
      queryFn: () => getAgencies(queryString),
    }),
    // Feeds the plan filter and the assign-plan select in the detail sheet.
    queryClient.prefetchQuery({
      queryKey: ["admin-plans"],
      queryFn: () => getAdminPlans(),
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agencies"
        description="Every tenant on the platform. Suspending one blocks its writes and its modules; deleting one also blocks its users."
      />

      <HydrationBoundary state={dehydrate(queryClient)}>
        <AgenciesTable initialQueryString={queryString} />
      </HydrationBoundary>
    </div>
  );
};

export default AgenciesPage;
