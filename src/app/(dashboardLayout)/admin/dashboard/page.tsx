import type { Metadata } from "next";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import PlatformOverview from "@/components/modules/Admin/PlatformOverview";
import PageHeader from "@/components/shared/PageHeader";
import { getPlatformStats } from "@/services/admin.services";

export const metadata: Metadata = { title: "Platform console" };

const AdminDashboardPage = async () => {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["platform-stats"],
    queryFn: () => getPlatformStats(),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform console"
        description="Every tenant at a glance: who is paying, who is trialling, and what needs attention."
      />

      <HydrationBoundary state={dehydrate(queryClient)}>
        <PlatformOverview />
      </HydrationBoundary>
    </div>
  );
};

export default AdminDashboardPage;
