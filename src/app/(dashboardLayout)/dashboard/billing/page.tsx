import type { Metadata } from "next";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import BillingView from "@/components/modules/Billing/BillingView";
import PageHeader from "@/components/shared/PageHeader";
import { getUserInfo } from "@/services/auth.services";
import {
  getAvailablePlans,
  getMySubscription,
  getPaymentHistory,
} from "@/services/billing.services";

export const metadata: Metadata = { title: "Billing" };

const BillingPage = async () => {
  const queryClient = new QueryClient();

  const [userInfo] = await Promise.all([
    getUserInfo(),
    queryClient.prefetchQuery({
      queryKey: ["my-subscription"],
      queryFn: () => getMySubscription(),
    }),
    queryClient.prefetchQuery({
      queryKey: ["billing-plans"],
      queryFn: () => getAvailablePlans(),
    }),
    queryClient.prefetchQuery({
      queryKey: ["payment-history"],
      queryFn: () => getPaymentHistory(),
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing"
        description="Your subscription, the plans on offer, and everything paid so far."
      />

      <HydrationBoundary state={dehydrate(queryClient)}>
        <BillingView
          canPay={userInfo?.role === "AGENCY_ADMIN"}
          currentPlanId={userInfo?.agency?.planId ?? null}
        />
      </HydrationBoundary>
    </div>
  );
};

export default BillingPage;
