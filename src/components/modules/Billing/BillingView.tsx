"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  RiBankCardLine,
  RiCalendarScheduleLine,
  RiCheckLine,
  RiExternalLinkLine,
  RiTimeLine,
} from "@remixicon/react";
import { toast } from "sonner";
import {
  retryOrderAction,
  startCheckoutAction,
} from "@/app/(dashboardLayout)/dashboard/billing/_action";
import Loader from "@/components/shared/Loader";
import StatusBadge from "@/components/shared/cell/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate, formatDateTime, formatNumber } from "@/lib/format";
import { type IPlan } from "@/types/user.types";
import { cn } from "@/lib/utils";
import {
  getAvailablePlans,
  getMyPendingManualPayment,
  getMySubscription,
  getPaymentHistory,
} from "@/services/billing.services";
import BkashPaymentModal from "./BkashPaymentModal";
import {
  AGENCY_STATUS_LABELS,
  AGENCY_STATUS_TONES,
  PLAN_FEATURE_LABELS,
  SUBSCRIPTION_ORDER_STATUS_LABELS,
  SUBSCRIPTION_ORDER_STATUS_TONES,
  type SubscriptionOrderStatus,
} from "@/types/enums.types";

interface BillingViewProps {
  /** Checkout and retry are AGENCY_ADMIN on the API. */
  canPay: boolean;
  currentPlanId: string | null;
}

const BillingView = ({ canPay, currentPlanId }: BillingViewProps) => {
  const [pendingPlanId, setPendingPlanId] = useState<string | null>(null);
  /** The plan the bKash dialog is open for, or null when it is closed. */
  const [payingFor, setPayingFor] = useState<IPlan | null>(null);

  const { data: subscriptionData, isLoading } = useQuery({
    queryKey: ["my-subscription"],
    queryFn: () => getMySubscription(),
  });

  const { data: plansData } = useQuery({
    queryKey: ["billing-plans"],
    queryFn: () => getAvailablePlans(),
  });

  const { data: historyData } = useQuery({
    queryKey: ["payment-history"],
    queryFn: () => getPaymentHistory(),
  });

  // What this agency has already claimed and is waiting on. Shown as a banner
  // and used to keep the plan buttons quiet: one claim at a time is all the
  // API accepts, so offering a second is offering an error.
  const { data: pendingPaymentData } = useQuery({
    queryKey: ["pending-manual-payment"],
    queryFn: () => getMyPendingManualPayment(),
  });

  const awaitingReview = pendingPaymentData?.data ?? null;
  const subscription = subscriptionData?.data;
  const plans = plansData?.data ?? [];
  const history = historyData?.data ?? [];

  const { mutateAsync: checkout } = useMutation({
    mutationFn: (planId: string) => startCheckoutAction(planId),
  });

  const { mutateAsync: retry, isPending: isRetrying } = useMutation({
    mutationFn: (transactionId: string) => retryOrderAction(transactionId),
  });

  /**
   * Leaves the app for the gateway. Not router.push: SSLCommerz is a different
   * origin, so this is a navigation away rather than a client-side route
   * change. `assign()` rather than setting `location.href` — the same
   * navigation, but a method call instead of mutating a value React Compiler
   * treats as outside the component.
   */
  const goToGateway = (gatewayUrl: string) => {
    window.location.assign(gatewayUrl);
  };

  const handleCheckout = async (planId: string) => {
    setPendingPlanId(planId);
    const result = await checkout(planId);
    setPendingPlanId(null);

    if (!result.success) {
      toast.error(result.message || "Could not start checkout");
      return;
    }

    goToGateway(result.data.gatewayUrl);
  };

  const handleRetry = async (transactionId: string) => {
    const result = await retry(transactionId);

    if (!result.success) {
      toast.error(result.message || "Could not retry payment");
      return;
    }

    goToGateway(result.data.gatewayUrl);
  };

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader size={32} label="Loading billing" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {awaitingReview && (
        <Card className="border-info/40">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <RiTimeLine className="size-5 text-info" aria-hidden="true" />
              <CardTitle className="text-base">We are checking your bKash payment</CardTitle>
            </div>
            <CardDescription>
              {/* Said plainly, because the gap between paying and the plan
                  turning on is where somebody decides the app is broken. */}
              You sent {formatCurrency(awaitingReview.amount)} for {awaitingReview.planName} on{" "}
              {formatDateTime(awaitingReview.createdAt)}, transaction{" "}
              <span className="font-mono">{awaitingReview.senderReference}</span>. Your plan starts
              as soon as we have matched it against our bKash statement.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {subscription && (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>
                {subscription.plan?.name ?? "No plan"}
              </CardTitle>
              <StatusBadge
                label={AGENCY_STATUS_LABELS[subscription.status]}
                tone={AGENCY_STATUS_TONES[subscription.status]}
              />
            </div>
            <CardDescription>
              {subscription.status === "TRIAL" ? (
                subscription.trialDaysLeft > 0 ? (
                  <>
                    {formatNumber(subscription.trialDaysLeft)} day
                    {subscription.trialDaysLeft === 1 ? "" : "s"} left in your trial, ending{" "}
                    {formatDate(subscription.trialEndsAt)}. Every module is unlocked until then.
                  </>
                ) : (
                  <>
                    Your trial ended on {formatDate(subscription.trialEndsAt)}. You can still
                    view your data, but changes are disabled until a plan is active.
                  </>
                )
              ) : subscription.status === "ACTIVE" ? (
                subscription.subscriptionEndsAt ? (
                  <>
                    Renews or expires {formatDate(subscription.subscriptionEndsAt)} —{" "}
                    {formatNumber(subscription.subscriptionDaysLeft)} day
                    {subscription.subscriptionDaysLeft === 1 ? "" : "s"} left.
                  </>
                ) : (
                  "Active with no end date."
                )
              ) : (
                "Changes are disabled until the agency is reactivated. Viewing still works."
              )}
            </CardDescription>
          </CardHeader>

          {subscription.plan && (
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {subscription.plan.features.map((feature) => (
                  <Badge key={feature} variant="secondary">
                    {PLAN_FEATURE_LABELS[feature]}
                  </Badge>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">Plans</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = plan.id === currentPlanId;

            return (
              <Card key={plan.id} className={cn(isCurrent && "border-primary")}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{plan.name}</CardTitle>
                    {isCurrent && (
                      <Badge variant="secondary" className="text-xs">
                        Current
                      </Badge>
                    )}
                  </div>
                  <CardDescription>
                    <span className="text-xl font-semibold text-foreground">
                      {formatCurrency(plan.price)}
                    </span>{" "}
                    for {formatNumber(plan.durationDays)} days
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {plan.description && (
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  )}

                  <ul className="space-y-1.5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <RiCheckLine className="size-4 shrink-0 text-success" aria-hidden="true" />
                        {PLAN_FEATURE_LABELS[feature]}
                      </li>
                    ))}
                  </ul>

                  {canPay ? (
                    <div className="space-y-2">
                      <Button
                        type="button"
                        className="w-full"
                        variant={isCurrent ? "outline" : "default"}
                        onClick={() => setPayingFor(plan)}
                        disabled={awaitingReview !== null}
                      >
                        <RiBankCardLine className="size-4" aria-hidden="true" />
                        {isCurrent ? "Renew" : "Choose plan"}
                      </Button>

                      {/* The card gateway is still here for a platform that has
                          credentials for one. bKash is the button because it is
                          how these agencies actually pay. */}
                      <button
                        type="button"
                        onClick={() => handleCheckout(plan.id)}
                        disabled={pendingPlanId !== null || awaitingReview !== null}
                        className="w-full text-xs text-muted-foreground underline-offset-2 hover:underline disabled:opacity-50"
                      >
                        {pendingPlanId === plan.id ? "Opening card checkout..." : "Pay by card instead"}
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Only an agency admin can change the plan.
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {plans.length === 0 && (
          <p className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
            No plans are on offer right now.
          </p>
        )}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Payment history</CardTitle>
          <CardDescription>
            Online payments and anything an operator recorded by hand.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nothing paid yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-3 py-2 text-left font-medium">Date</th>
                    <th className="px-3 py-2 text-left font-medium">Plan</th>
                    <th className="px-3 py-2 text-left font-medium">Method</th>
                    <th className="px-3 py-2 text-right font-medium">Amount</th>
                    <th className="px-3 py-2 text-left font-medium">Status</th>
                    {canPay && <th className="px-3 py-2" />}
                  </tr>
                </thead>
                <tbody>
                  {history.map((row) => {
                    // Only an online attempt that did not go through can be
                    // retried; a manual row is a record, not an attempt.
                    const canRetry =
                      canPay &&
                      row.source === "online" &&
                      (row.status === "FAILED" || row.status === "PENDING") &&
                      Boolean(row.reference);

                    return (
                      <tr key={`${row.source}-${row.id}`} className="border-b last:border-0">
                        <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                          {formatDate(row.date)}
                        </td>
                        <td className="px-3 py-2">{row.planName ?? "—"}</td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {row.method}
                          {row.reference && (
                            <span className="block font-mono text-xs">{row.reference}</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right font-medium tabular-nums">
                          {formatCurrency(row.amount)}
                        </td>
                        <td className="px-3 py-2">
                          <StatusBadge
                            label={
                              SUBSCRIPTION_ORDER_STATUS_LABELS[
                                row.status as SubscriptionOrderStatus
                              ] ?? row.status
                            }
                            tone={
                              SUBSCRIPTION_ORDER_STATUS_TONES[
                                row.status as SubscriptionOrderStatus
                              ] ?? "neutral"
                            }
                          />
                        </td>
                        {canPay && (
                          <td className="px-3 py-2">
                            {canRetry && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleRetry(row.reference!)}
                                disabled={isRetrying}
                              >
                                <RiExternalLinkLine className="size-3.5" aria-hidden="true" />
                                Retry
                              </Button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
            <RiCalendarScheduleLine className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            A payment is only ever confirmed by the gateway calling us back, not by the browser
            returning — so a plan activates a moment after you are sent back here.
          </p>
        </CardContent>
      </Card>
      <BkashPaymentModal plan={payingFor} onOpenChange={() => setPayingFor(null)} />
    </div>
  );
};

export default BillingView;
