import type { Metadata } from "next";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import PlansTable from "@/components/modules/Admin/Plans/PlansTable";
import PageHeader from "@/components/shared/PageHeader";
import { getAdminPlans } from "@/services/admin.services";

export const metadata: Metadata = { title: "Plans" };

const PlansPage = async () => {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["admin-plans"],
    queryFn: () => getAdminPlans(),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plans"
        description="What agencies can buy. A plan is withdrawn rather than deleted, so no agency loses the modules it is paying for."
      />

      <HydrationBoundary state={dehydrate(queryClient)}>
        <PlansTable />
      </HydrationBoundary>
    </div>
  );
};

export default PlansPage;
