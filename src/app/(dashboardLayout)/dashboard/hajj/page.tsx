import type { Metadata } from "next";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import HajjBookingsTable from "@/components/modules/Hajj/HajjBookingsTable";
import PageHeader from "@/components/shared/PageHeader";
import { buildQueryString, type PageSearchParams } from "@/lib/queryString";
import { getUserInfo } from "@/services/auth.services";
import { getCustomerDashboard } from "@/services/customer.services";
import {
  getHajjBatches,
  getHajjBookings,
  getHajjPackages,
} from "@/services/hajj.services";

export const metadata: Metadata = { title: "Hajj & Umrah" };

const HajjPage = async ({ searchParams }: { searchParams: PageSearchParams }) => {
  const queryString = buildQueryString(await searchParams);

  const queryClient = new QueryClient();

  const [userInfo] = await Promise.all([
    getUserInfo(),
    queryClient.prefetchQuery({
      queryKey: ["hajj-bookings", queryString],
      queryFn: () => getHajjBookings(queryString),
    }),
    // Both feed the filters and the booking form.
    queryClient.prefetchQuery({
      queryKey: ["hajj-packages"],
      queryFn: () => getHajjPackages("limit=200"),
    }),
    queryClient.prefetchQuery({
      queryKey: ["hajj-batches"],
      queryFn: () => getHajjBatches("limit=200"),
    }),
    queryClient.prefetchQuery({
      queryKey: ["customer-dashboard"],
      queryFn: () => getCustomerDashboard(),
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bookings"
        description="One row per pilgrim. A booking snapshots its price, and cancelling one frees both the seat and the beds. Packages and departures are set up on the Packages page."
      />

      <HydrationBoundary state={dehydrate(queryClient)}>
        <HajjBookingsTable
          initialQueryString={queryString}
          isAdmin={userInfo?.role === "AGENCY_ADMIN"}
        />
      </HydrationBoundary>
    </div>
  );
};

export default HajjPage;
