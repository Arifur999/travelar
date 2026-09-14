import type { Metadata } from "next";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import ActivityLogTable from "@/components/modules/Admin/Activity/ActivityLogTable";
import PageHeader from "@/components/shared/PageHeader";
import { buildQueryString, type PageSearchParams } from "@/lib/queryString";
import { getActivityLog } from "@/services/admin.services";

export const metadata: Metadata = { title: "Activity log" };

const ActivityLogPage = async ({ searchParams }: { searchParams: PageSearchParams }) => {
  const queryString = buildQueryString(await searchParams);

  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["activity-log", queryString],
    queryFn: () => getActivityLog(queryString),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity log"
        description="Every operator action on plans and agencies, append-only."
      />

      <HydrationBoundary state={dehydrate(queryClient)}>
        <ActivityLogTable initialQueryString={queryString} />
      </HydrationBoundary>
    </div>
  );
};

export default ActivityLogPage;
