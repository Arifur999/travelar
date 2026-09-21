import type { Metadata } from "next";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import HotelBookingsTable from "@/components/modules/Hotels/HotelBookingsTable";
import HotelOverview from "@/components/modules/Hotels/HotelOverview";
import PageHeader from "@/components/shared/PageHeader";
import { buildQueryString, type PageSearchParams } from "@/lib/queryString";
import { getUserInfo } from "@/services/auth.services";
import { getCustomerDashboard } from "@/services/customer.services";
import { getHotelBookings, getHotelSummary } from "@/services/hotel.services";

export const metadata: Metadata = { title: "Hotel" };

const HotelsPage = async ({ searchParams }: { searchParams: PageSearchParams }) => {
  const queryString = buildQueryString(await searchParams);

  const queryClient = new QueryClient();

  const [userInfo] = await Promise.all([
    getUserInfo(),
    queryClient.prefetchQuery({
      queryKey: ["hotel-bookings", queryString],
      queryFn: () => getHotelBookings(queryString),
    }),
    queryClient.prefetchQuery({
      queryKey: ["hotel-summary"],
      queryFn: () => getHotelSummary(),
    }),
    queryClient.prefetchQuery({
      queryKey: ["customer-dashboard"],
      queryFn: () => getCustomerDashboard(),
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hotel"
        description="Stays booked for customers. Nights are counted from the dates, and cancelling one stops billing for it."
      />

      <HydrationBoundary state={dehydrate(queryClient)}>
        <HotelBookingsTable
          initialQueryString={queryString}
          isAdmin={userInfo?.role === "AGENCY_ADMIN"}
        />
        <HotelOverview />
      </HydrationBoundary>
    </div>
  );
};

export default HotelsPage;
