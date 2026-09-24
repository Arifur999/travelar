import type { Metadata } from "next";
import Link from "next/link";
import {
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiForbidLine,
  RiQuestionLine,
} from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getOrderStatus } from "@/services/billing.services";
import { SUBSCRIPTION_ORDER_STATUS_LABELS } from "@/types/enums.types";

export const metadata: Metadata = { title: "Payment result" };

/**
 * Where SSLCommerz sends the browser back to.
 *
 * The backend's success / fail / cancel callbacks all redirect here as
 * `/billing/payment-result?status=<outcome>&tran_id=<id>` — the param names
 * come from `clientResultUrl` in the API and must match it exactly.
 *
 * This page deliberately does NOT mark anything paid. The gateway's
 * server-to-server IPN is the only thing that confirms an order, so the page
 * looks the order up rather than trusting the redirect it arrived on: anyone
 * can type this URL, and doing so must prove nothing about whether money moved.
 */
const RESULTS = {
  success: {
    icon: RiCheckboxCircleLine,
    tone: "text-success",
    title: "Payment received",
    body: "Your plan activates as soon as the gateway confirms it with us, which is usually immediate.",
  },
  failed: {
    icon: RiCloseCircleLine,
    tone: "text-destructive",
    title: "Payment failed",
    body: "Nothing was charged. You can start again from the billing page.",
  },
  cancelled: {
    icon: RiForbidLine,
    tone: "text-muted-foreground",
    title: "Payment cancelled",
    body: "You stopped before paying, so nothing was charged.",
  },
} as const;

const UNKNOWN = {
  icon: RiQuestionLine,
  tone: "text-muted-foreground",
  title: "Payment result",
  body: "We could not tell how this attempt ended. The recorded status below is what actually happened.",
} as const;

const PaymentResultPage = async ({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) => {
  const query = await searchParams;

  const rawStatus = typeof query.status === "string" ? query.status : "";
  // An unrecognised status is shown honestly rather than 404'd — the payment
  // may well have succeeded, and hiding the page would lose the reference.
  const config = rawStatus in RESULTS ? RESULTS[rawStatus as keyof typeof RESULTS] : UNKNOWN;
  const Icon = config.icon;

  const transactionId = typeof query.tran_id === "string" ? query.tran_id : undefined;

  // Read the real state rather than believing the redirect. If the lookup
  // fails the page still renders — the reference alone is worth showing.
  let orderStatus: string | null = null;
  if (transactionId) {
    try {
      const order = await getOrderStatus(transactionId);
      orderStatus = order.data.status;
    } catch {
      orderStatus = null;
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <Card>
        <CardHeader className="items-center text-center">
          <Icon className={`size-10 ${config.tone}`} aria-hidden="true" />
          <CardTitle className="mt-2">{config.title}</CardTitle>
          <CardDescription>{config.body}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {transactionId && (
            <dl className="rounded-lg border bg-muted/30 p-3 text-sm">
              <div className="flex justify-between gap-4 py-1">
                <dt className="text-muted-foreground">Reference</dt>
                <dd className="truncate font-mono text-xs">{transactionId}</dd>
              </div>
              <div className="flex justify-between gap-4 py-1">
                <dt className="text-muted-foreground">Recorded status</dt>
                <dd className="font-medium">
                  {orderStatus
                    ? (SUBSCRIPTION_ORDER_STATUS_LABELS[
                        orderStatus as keyof typeof SUBSCRIPTION_ORDER_STATUS_LABELS
                      ] ?? orderStatus)
                    : "Not found"}
                </dd>
              </div>
            </dl>
          )}

          <p className="text-xs text-muted-foreground">
            Only the gateway calling our server confirms a payment — returning to this page does
            not. If the status above still says Pending, refresh the billing page in a moment.
          </p>

          <div className="flex justify-center gap-3">
            <Button asChild>
              <Link href="/dashboard/billing">Back to billing</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentResultPage;
