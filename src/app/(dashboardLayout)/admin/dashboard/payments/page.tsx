import type { Metadata } from "next";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import ManualPaymentQueue from "@/components/modules/Admin/Payments/ManualPaymentQueue";
import PaymentSettingsCard from "@/components/modules/Admin/Payments/PaymentSettingsCard";
import PageHeader from "@/components/shared/PageHeader";
import { getManualPayments, getPaymentSettings } from "@/services/admin.services";

export const metadata: Metadata = { title: "Payments" };

/**
 * The two halves of taking money by bKash: where it is sent, and what arrived.
 *
 * Together on one screen on purpose — the settings are what make the queue
 * possible, and an empty queue with no number set means something different
 * from an empty queue with one.
 */
const AdminPaymentsPage = async () => {
  const queryClient = new QueryClient();

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ["admin-payment-settings"],
      queryFn: () => getPaymentSettings(),
    }),
    queryClient.prefetchQuery({
      queryKey: ["admin-manual-payments"],
      queryFn: () => getManualPayments("PENDING"),
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="The bKash account agencies pay into, and the payments waiting to be checked."
      />

      <HydrationBoundary state={dehydrate(queryClient)}>
        <PaymentSettingsCard />
        <ManualPaymentQueue />
      </HydrationBoundary>
    </div>
  );
};

export default AdminPaymentsPage;
