"use client";

import { useQuery } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/format";
import { PAYMENT_SOURCE_OPTIONS, type PaymentSource } from "@/lib/paymentSource";
import { getCashAccounts } from "@/services/account.services";

interface PaymentSourceFieldsProps {
  source: PaymentSource;
  onSourceChange: (source: PaymentSource) => void;
  cashAccountId: string;
  onAccountChange: (cashAccountId: string) => void;
  /** What the customer has left of what they paid in. */
  walletBalance: number;
  /** Fetch accounts only while the form is on screen. */
  active: boolean;
  disabled?: boolean;
  /** Field id prefix, so two payment forms on one page keep distinct labels. */
  idPrefix?: string;
}

/**
 * Where the money is coming from, and — when it is arriving now — which
 * account it lands in.
 *
 * Shared by the ticket, visa and Hajj payment forms, which all offer the same
 * two choices. "Customer balance" is offered only when there is one: an
 * option that always fails is worse than no option.
 */
const PaymentSourceFields = ({
  source,
  onSourceChange,
  cashAccountId,
  onAccountChange,
  walletBalance,
  active,
  disabled,
  idPrefix = "payment",
}: PaymentSourceFieldsProps) => {
  const { data } = useQuery({
    queryKey: ["cash-accounts"],
    queryFn: () => getCashAccounts(),
    enabled: active,
  });

  const accounts = (data?.data.data ?? []).filter((account) => account.isActive);
  const hasBalance = walletBalance > 0;

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-source`}>Paid from</Label>
        <Select
          value={source}
          onValueChange={(next) => onSourceChange(next as PaymentSource)}
          disabled={disabled}
        >
          <SelectTrigger id={`${idPrefix}-source`} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAYMENT_SOURCE_OPTIONS.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                disabled={option.value === "WALLET" && !hasBalance}
              >
                {option.value === "WALLET"
                  ? hasBalance
                    ? `Customer balance — ${formatCurrency(walletBalance)} left`
                    : "Customer balance — nothing paid in advance"
                  : option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {source === "ACCOUNT" ? (
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-account`}>Into account</Label>
          <Select value={cashAccountId} onValueChange={onAccountChange} disabled={disabled}>
            <SelectTrigger id={`${idPrefix}-account`} className="w-full">
              <SelectValue placeholder="Pick an account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name} — {formatCurrency(account.currentBalance)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <p className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
          Settled from the {formatCurrency(walletBalance)} this customer paid in earlier. No
          account changes — that money was banked when it came in.
        </p>
      )}
    </div>
  );
};

export default PaymentSourceFields;
