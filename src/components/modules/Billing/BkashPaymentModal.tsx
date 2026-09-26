"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { RiCheckLine, RiFileCopyLine } from "@remixicon/react";
import { toast } from "sonner";
import { submitManualPaymentAction } from "@/app/(dashboardLayout)/dashboard/billing/_action";
import Loader from "@/components/shared/Loader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/format";
import { getManualPaymentInfo } from "@/services/billing.services";
import { type IPlan } from "@/types/user.types";

interface BkashPaymentModalProps {
  plan: IPlan | null;
  onOpenChange: (open: boolean) => void;
}

/**
 * Paying a subscription by bKash.
 *
 * Send the money first, then tell us about it. Nothing here takes a payment —
 * what the form records is a claim, which an operator checks against their own
 * bKash statement before the plan turns on. The screen says so plainly, because
 * an agency that thinks it has just bought a plan and finds it still off is a
 * support call, and a fair one.
 */
const BkashPaymentModal = ({ plan, onOpenChange }: BkashPaymentModalProps) => {
  const [senderNumber, setSenderNumber] = useState("");
  const [senderReference, setSenderReference] = useState("");
  const [copied, setCopied] = useState(false);

  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: infoData, isLoading: loadingInfo } = useQuery({
    queryKey: ["manual-payment-info"],
    queryFn: () => getManualPaymentInfo(),
    // The number does not change while somebody is looking at it.
    staleTime: 5 * 60 * 1000,
  });

  const info = infoData?.data;

  const { mutateAsync: send, isPending } = useMutation({
    mutationFn: submitManualPaymentAction,
  });

  const copyNumber = async () => {
    if (!info?.number) return;

    try {
      await navigator.clipboard.writeText(info.number);
      setCopied(true);
      // Long enough to notice, short enough that the button is ready again by
      // the time somebody has switched to bKash and back.
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access is refused in some browsers and over plain http. The
      // number is on screen either way, so this is not worth an error toast.
      toast.info("Copy it from the screen — your browser would not let us.");
    }
  };

  const close = () => {
    setSenderNumber("");
    setSenderReference("");
    onOpenChange(false);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!plan) return;

    let result;
    try {
      result = await send({
        planId: plan.id,
        senderNumber: senderNumber.trim(),
        senderReference: senderReference.trim(),
      });
    } catch {
      toast.error("Could not send your bKash payment. Check your connection and try again.");
      return;
    }

    if (!result.success) {
      toast.error(result.message || "Could not send your bKash payment");
      return;
    }

    toast.success("Sent — we will confirm it shortly");
    await queryClient.invalidateQueries({ queryKey: ["pending-manual-payment"] });
    await queryClient.invalidateQueries({ queryKey: ["payment-history"] });
    router.refresh();
    close();
  };

  return (
    <Dialog open={plan !== null} onOpenChange={(open) => (open ? undefined : close())}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pay with bKash</DialogTitle>
          <DialogDescription>
            {plan ? (
              <>
                Send <strong>{formatCurrency(plan.price)}</strong> for {plan.name}, then tell us
                the transaction ID. Your plan starts once we have checked it.
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        {loadingInfo ? (
          <div className="flex h-40 items-center justify-center">
            <Loader size={24} label="Loading payment details" />
          </div>
        ) : !info?.available ? (
          <p className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
            Paying by bKash is not set up yet. Ask whoever runs the platform to add the bKash
            number and QR.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex justify-center">
              {/* Served through a route handler rather than a static file:
                  the operator uploads it from the admin screen, so it is not
                  something that ships with the app. next/image would want a
                  known width and a loader for a URL that changes. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/api/bkash-qr"
                alt="bKash QR code for this account"
                width={220}
                height={220}
                className="size-55 rounded-lg border object-contain"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Or send to this number</Label>
              <button
                type="button"
                onClick={copyNumber}
                className="flex w-full items-center justify-between rounded-lg border bg-muted/30 px-3 py-2.5 text-left transition-colors hover:bg-muted/60"
              >
                <span className="font-medium tabular-nums">{info.number}</span>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {copied ? (
                    <>
                      <RiCheckLine className="size-3.5 text-success" aria-hidden="true" />
                      Copied
                    </>
                  ) : (
                    <>
                      <RiFileCopyLine className="size-3.5" aria-hidden="true" />
                      Tap to copy
                    </>
                  )}
                </span>
              </button>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="senderNumber">Your bKash number</Label>
              <Input
                id="senderNumber"
                name="senderNumber"
                inputMode="tel"
                autoComplete="tel"
                placeholder="01XXXXXXXXX"
                value={senderNumber}
                onChange={(event) => setSenderNumber(event.target.value)}
                required
                minLength={11}
                maxLength={20}
                disabled={isPending}
              />
              <p className="text-xs text-muted-foreground">The number you sent the money from.</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="senderReference">Transaction ID</Label>
              <Input
                id="senderReference"
                name="senderReference"
                placeholder="8N7A2B4C1D"
                value={senderReference}
                onChange={(event) => setSenderReference(event.target.value.toUpperCase())}
                required
                minLength={6}
                maxLength={32}
                disabled={isPending}
                className="font-mono tracking-wide"
              />
              <p className="text-xs text-muted-foreground">
                From the bKash message — it looks like 8N7A2B4C1D.
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button type="button" variant="outline" onClick={close} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader size={16} onDark label="Sending" />
                    <span className="animate-pulse">Sending...</span>
                  </>
                ) : (
                  "I have paid"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BkashPaymentModal;
