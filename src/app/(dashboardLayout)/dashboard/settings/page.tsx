import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import AgencyProfileView from "@/components/modules/Settings/AgencyProfileView";
import PageHeader from "@/components/shared/PageHeader";
import { getUserInfo } from "@/services/auth.services";
import { getAgencyProfile } from "@/services/team.services";

export const metadata: Metadata = { title: "Agency profile" };

const SettingsPage = async () => {
  const queryClient = new QueryClient();

  const [userInfo] = await Promise.all([
    getUserInfo(),
    queryClient.prefetchQuery({
      queryKey: ["agency-profile"],
      queryFn: () => getAgencyProfile(),
    }),
  ]);

  if (!userInfo) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agency profile"
        description="How your agency appears on invoices and in the workspace. Plan and billing dates are managed from Billing."
      />

      <HydrationBoundary state={dehydrate(queryClient)}>
        <AgencyProfileView canEdit={userInfo.role === "AGENCY_ADMIN"} />
      </HydrationBoundary>
    </div>
  );
};

export default SettingsPage;
