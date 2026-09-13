import type { Metadata } from "next";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import VisaAgentsPanel from "@/components/modules/Visa/VisaAgentsPanel";
import VisaCasesTable from "@/components/modules/Visa/VisaCasesTable";
import PageHeader from "@/components/shared/PageHeader";
import { buildQueryString, type PageSearchParams } from "@/lib/queryString";
import { getUserInfo } from "@/services/auth.services";
import { getCustomerDashboard } from "@/services/customer.services";
import { getVisaAgents, getVisaCases } from "@/services/visa.services";

export const metadata: Metadata = { title: "Visa cases" };

const VisaPage = async ({ searchParams }: { searchParams: PageSearchParams }) => {
  const queryString = buildQueryString(await searchParams);

  const queryClient = new QueryClient();

  const [userInfo] = await Promise.all([
    getUserInfo(),
    queryClient.prefetchQuery({
      queryKey: ["visa-cases", queryString],
      queryFn: () => getVisaCases(queryString),
    }),
    queryClient.prefetchQuery({
      queryKey: ["visa-agents"],
      queryFn: () => getVisaAgents("limit=200"),
    }),
    queryClient.prefetchQuery({
      queryKey: ["customer-dashboard"],
      queryFn: () => getCustomerDashboard(),
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Visa cases"
        description="Applications, their document checklists and what each one bills. A case starts at Submitted and moves one way through the lifecycle."
      />

      <HydrationBoundary state={dehydrate(queryClient)}>
        <VisaCasesTable
          initialQueryString={queryString}
          isAdmin={userInfo?.role === "AGENCY_ADMIN"}
        />
        <VisaAgentsPanel />
      </HydrationBoundary>
    </div>
  );
};

export default VisaPage;
