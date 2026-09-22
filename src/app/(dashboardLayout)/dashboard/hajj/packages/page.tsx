import type { Metadata } from "next";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import HajjSetupPanel from "@/components/modules/Hajj/HajjSetupPanel";
import PageHeader from "@/components/shared/PageHeader";
import { getHajjBatches, getHajjPackages } from "@/services/hajj.services";

export const metadata: Metadata = { title: "Hajj packages" };

/**
 * What the agency sells and when it departs — set up here, then chosen on a
 * booking. Kept off the bookings page because it is configured in bursts and
 * then left alone, while bookings are worked on all day.
 */
const HajjPackagesPage = async () => {
  const queryClient = new QueryClient();

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ["hajj-packages"],
      queryFn: () => getHajjPackages("limit=200"),
    }),
    queryClient.prefetchQuery({
      queryKey: ["hajj-batches"],
      queryFn: () => getHajjBatches("limit=200"),
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Packages & batches"
        description="What you sell, at what price, and which departure each pilgrim joins. A booking snapshots the price, so changing it here never moves an existing booking."
      />

      <HydrationBoundary state={dehydrate(queryClient)}>
        <HajjSetupPanel />
      </HydrationBoundary>
    </div>
  );
};

export default HajjPackagesPage;
