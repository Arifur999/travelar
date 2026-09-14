import type { Metadata } from "next";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import AdminSupportView from "@/components/modules/Admin/Support/AdminSupportView";
import PageHeader from "@/components/shared/PageHeader";
import { buildQueryString, type PageSearchParams } from "@/lib/queryString";
import { getAllTickets } from "@/services/support.services";

export const metadata: Metadata = { title: "Support inbox" };

const AdminSupportPage = async ({ searchParams }: { searchParams: PageSearchParams }) => {
  const queryString = buildQueryString(await searchParams);

  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["admin-tickets", queryString],
    queryFn: () => getAllTickets(queryString),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support inbox"
        description="Tickets from every agency. You can still reply on a closed thread; the agency cannot."
      />

      <HydrationBoundary state={dehydrate(queryClient)}>
        <AdminSupportView initialQueryString={queryString} />
      </HydrationBoundary>
    </div>
  );
};

export default AdminSupportPage;
