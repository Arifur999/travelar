import type { Metadata } from "next";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import AirlinesTable from "@/components/modules/MasterData/Airlines/AirlinesTable";
import PageHeader from "@/components/shared/PageHeader";
import { buildQueryString, type PageSearchParams } from "@/lib/queryString";
import { getAirlines } from "@/services/masterData.services";

export const metadata: Metadata = { title: "Airlines" };

const AirlinesPage = async ({ searchParams }: { searchParams: PageSearchParams }) => {
  const queryString = buildQueryString(await searchParams);

  const queryClient = new QueryClient();

  // The key must match the one AirlinesTable uses, or the dehydrated entry is
  // never read and the client refetches everything on mount.
  await queryClient.prefetchQuery({
    queryKey: ["airlines", queryString],
    queryFn: () => getAirlines(queryString),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Airlines"
        description="The carriers your agency issues tickets on. Tickets reference these rather than a free-text name, so reports group correctly."
      />

      <HydrationBoundary state={dehydrate(queryClient)}>
        <AirlinesTable initialQueryString={queryString} />
      </HydrationBoundary>
    </div>
  );
};

export default AirlinesPage;
