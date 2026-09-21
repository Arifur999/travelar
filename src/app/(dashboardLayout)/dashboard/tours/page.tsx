import type { Metadata } from "next";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import TourBookingsTable from "@/components/modules/Tours/TourBookingsTable";
import TourDeparturesChart from "@/components/modules/Tours/TourDeparturesChart";
import ToursPanel from "@/components/modules/Tours/ToursPanel";
import PageHeader from "@/components/shared/PageHeader";
import { buildQueryString, type PageSearchParams } from "@/lib/queryString";
import { getUserInfo } from "@/services/auth.services";
import { getCustomerDashboard } from "@/services/customer.services";
import { getTourBookings, getTours } from "@/services/tour.services";

export const metadata: Metadata = { title: "Tours" };

const ToursPage = async ({ searchParams }: { searchParams: PageSearchParams }) => {
  const queryString = buildQueryString(await searchParams);

  const queryClient = new QueryClient();

  const [userInfo] = await Promise.all([
    getUserInfo(),
    queryClient.prefetchQuery({
      queryKey: ["tour-bookings", queryString],
      queryFn: () => getTourBookings(queryString),
    }),
    // Feeds the tour filter, the chart and the booking form.
    queryClient.prefetchQuery({
      queryKey: ["tours"],
      queryFn: () => getTours("limit=200"),
    }),
    queryClient.prefetchQuery({
      queryKey: ["customer-dashboard"],
      queryFn: () => getCustomerDashboard(),
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tours"
        description="Dated trips and the seats sold on them. A booking snapshots its price, and cancelling one gives the seats straight back."
      />

      <HydrationBoundary state={dehydrate(queryClient)}>
        <TourBookingsTable
          initialQueryString={queryString}
          isAdmin={userInfo?.role === "AGENCY_ADMIN"}
        />
        <TourDeparturesChart />
        <ToursPanel isAdmin={userInfo?.role === "AGENCY_ADMIN"} />
      </HydrationBoundary>
    </div>
  );
};

export default ToursPage;
