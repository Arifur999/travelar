import type { Metadata } from "next";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import RoutesTable from "@/components/modules/MasterData/Routes/RoutesTable";
import PageHeader from "@/components/shared/PageHeader";
import { buildQueryString, type PageSearchParams } from "@/lib/queryString";
import { getRoutes } from "@/services/masterData.services";

export const metadata: Metadata = { title: "Routes" };

const RoutesPage = async ({ searchParams }: { searchParams: PageSearchParams }) => {
  const queryString = buildQueryString(await searchParams);

  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["routes", queryString],
    queryFn: () => getRoutes(queryString),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Routes"
        description="The sectors you sell. Saved once here so a ticket picks a route instead of retyping it, which is what lets reports group by sector."
      />

      <HydrationBoundary state={dehydrate(queryClient)}>
        <RoutesTable initialQueryString={queryString} />
      </HydrationBoundary>
    </div>
  );
};

export default RoutesPage;
