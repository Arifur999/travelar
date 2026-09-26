"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RiCheckLine, RiQrCodeLine, RiUploadLine } from "@remixicon/react";
import { toast } from "sonner";
import {
  updatePaymentSettingsAction,
  uploadPaymentQrAction,
} from "@/app/(dashboardLayout)/admin/dashboard/payments/_action";
import Loader from "@/components/shared/Loader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateTime } from "@/lib/format";
import { getPaymentSettings } from "@/services/admin.services";

/** What the API accepts. Anything bigger is the wrong file, not a QR. */
const MAX_QR_BYTES = 2 * 1024 * 1024;
const QR_TYPES = ["image/png", "image/jpeg", "image/webp"];

/**
 * The bKash account agencies pay a subscription into.
 *
 * Both halves have to be set before the payment dialog offers bKash at all:
 * half a set of instructions is worse than none, because somebody sends money
 * with no reference or scans a code and has nothing to type back.
 */
const PaymentSettingsCard = () => {
  const [number, setNumber] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-payment-settings"],
    queryFn: () => getPaymentSettings(),
  });

  const settings = data?.data;
  // null until the operator types: the field shows what is saved until then.
  const numberValue = number ?? settings?.bkashNumber ?? "";

  const { mutateAsync: saveNumber, isPending: savingNumber } = useMutation({
    mutationFn: updatePaymentSettingsAction,
  });

  const { mutateAsync: saveQr, isPending: savingQr } = useMutation({
    mutationFn: uploadPaymentQrAction,
  });

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin-payment-settings"] });
  };

  const handleSaveNumber = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = await saveNumber(numberValue.trim());
    if (!result.success) {
      toast.error(result.message || "Could not save the number");
      return;
    }

    toast.success("bKash number saved");
    setNumber(null);
    await refresh();
  };

  const handleQrChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Checked here as well as on the API so the answer is instant and names
    // the actual problem, rather than coming back as a 400.
    if (!QR_TYPES.includes(file.type)) {
      toast.error("Upload the QR as a PNG, JPEG or WebP image");
      return;
    }
    if (file.size > MAX_QR_BYTES) {
      toast.error("That image is larger than 2 MB — a QR should be small");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    const result = await saveQr(formData);
    if (fileRef.current) fileRef.current.value = "";

    if (!result.success) {
      toast.error(result.message || "Could not save the QR");
      return;
    }

    toast.success("bKash QR saved");
    await refresh();
  };

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader size={28} label="Loading payment settings" />
      </div>
    );
  }

  const ready = Boolean(settings?.bkashNumber) && Boolean(settings?.hasQr);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Where agencies pay</CardTitle>
        <CardDescription>
          The bKash account a subscription is paid into, and the QR agencies scan. Both have to be
          set before bKash is offered on the billing screen.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {!ready && (
          <p className="rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm">
            bKash is not being offered yet.{" "}
            {settings?.bkashNumber ? "Upload the QR" : "Add the number"} to turn it on.
          </p>
        )}

        <form onSubmit={handleSaveNumber} className="flex flex-wrap items-end gap-3">
          <div className="min-w-0 flex-1 space-y-1.5">
            <Label htmlFor="bkashNumber">bKash number</Label>
            <Input
              id="bkashNumber"
              name="bkashNumber"
              inputMode="tel"
              placeholder="01XXXXXXXXX"
              value={numberValue}
              onChange={(event) => setNumber(event.target.value)}
              disabled={savingNumber}
              className="sm:max-w-xs"
            />
            <p className="text-xs text-muted-foreground">
              Shown to agencies with a button to copy it. Clearing it turns bKash off.
            </p>
          </div>

          <Button type="submit" disabled={savingNumber}>
            {savingNumber ? (
              <>
                <Loader size={16} onDark label="Saving" />
                <span className="animate-pulse">Saving...</span>
              </>
            ) : (
              "Save number"
            )}
          </Button>
        </form>

        <div className="space-y-2">
          <Label htmlFor="qr">QR code</Label>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex size-28 items-center justify-center rounded-xl border bg-muted/30">
              {settings?.hasQr ? (
                // Straight from the API, and cache-busted on the day it was
                // set so replacing it does not leave the old one on screen.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/bkash-qr?v=${settings.qrSetAt ?? ""}`}
                  alt="The bKash QR agencies are shown"
                  className="size-full rounded-xl object-contain p-1"
                />
              ) : (
                <RiQrCodeLine className="size-8 text-muted-foreground" aria-hidden="true" />
              )}
            </div>

            <div className="space-y-1.5">
              <Input
                ref={fileRef}
                id="qr"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleQrChange}
                disabled={savingQr}
                className="w-full sm:w-80"
              />
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {savingQr ? (
                  <>
                    <Loader size={14} label="Uploading" />
                    Uploading...
                  </>
                ) : settings?.hasQr ? (
                  <>
                    <RiCheckLine className="size-3.5 text-success" aria-hidden="true" />
                    Set {formatDateTime(settings.qrSetAt)} — choosing a file replaces it
                  </>
                ) : (
                  <>
                    <RiUploadLine className="size-3.5" aria-hidden="true" />
                    PNG, JPEG or WebP, up to 2 MB
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentSettingsCard;
