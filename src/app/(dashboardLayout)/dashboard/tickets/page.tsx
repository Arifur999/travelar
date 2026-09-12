import type { Metadata } from "next";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import TicketsTable from "@/components/modules/Tickets/TicketsTable";
import PageHeader from "@/components/shared/PageHeader";
import { buildQueryString, type PageSearchParams } from "@/lib/queryString";
import { getUserInfo } from "@/services/auth.services";
import { getCustomerDashboard } from "@/services/customer.services";
import { getAirlines } from "@/services/masterData.services";
import { getTickets } from "@/services/ticket.services";

export const metadata: Metadata = { title: "Tickets" };

const TicketsPage = async ({ searchParams }: { searchParams: PageSearchParams }) => {
  const queryString = buildQueryString(await searchParams);

  const queryClient = new QueryClient();

  const [userInfo] = await Promise.all([
    getUserInfo(),
    queryClient.prefetchQuery({
      queryKey: ["tickets", queryString],
      queryFn: () => getTickets(queryString),
    }),
    // Both feed the filter dropdowns, so they must be warm on first paint.
    queryClient.prefetchQuery({
      queryKey: ["customer-dashboard"],
      queryFn: () => getCustomerDashboard(),
    }),
    queryClient.prefetchQuery({
      queryKey: ["airlines", "limit=200"],
      queryFn: () => getAirlines("limit=200"),
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tickets"
        description="Flight sales. A date change adds to both the fare and the cost rather than replacing either, and a refund reduces what the customer is charged."
      />

      <HydrationBoundary state={dehydrate(queryClient)}>
        <TicketsTable
          initialQueryString={queryString}
          isAdmin={userInfo?.role === "AGENCY_ADMIN"}
        />
      </HydrationBoundary>
    </div>
  );
};

export default TicketsPage;
