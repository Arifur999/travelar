import type { Metadata } from "next";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import SupportView from "@/components/modules/Support/SupportView";
import PageHeader from "@/components/shared/PageHeader";
import { getMyTickets } from "@/services/support.services";

export const metadata: Metadata = { title: "Support" };

const SupportPage = async () => {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["support-tickets"],
    queryFn: () => getMyTickets("limit=50&sortBy=updatedAt&sortOrder=desc"),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support"
        description="Open a ticket and keep the conversation in one thread. Never gated on your plan or expiry."
      />

      <HydrationBoundary state={dehydrate(queryClient)}>
        <SupportView />
      </HydrationBoundary>
    </div>
  );
};

export default SupportPage;
