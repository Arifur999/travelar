"use client";

import { useQuery } from "@tanstack/react-query";
import Loader from "@/components/shared/Loader";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getSupplierLedger } from "@/services/supplier.services";
import { type ISupplier, type ISupplierLedgerRow } from "@/types/supplier.types";

interface SupplierLedgerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: ISupplier;
}

const TYPE_LABELS: Record<ISupplierLedgerRow["type"], string> = {
  opening: "Opening",
  purchase: "Purchase",
  payment: "Payment",
};

const TYPE_TONES: Record<ISupplierLedgerRow["type"], string> = {
  opening: "bg-muted text-muted-foreground",
  purchase: "bg-warning/10 text-warning",
  payment: "bg-success/10 text-success",
};

/**
 * The statement behind the payable figure.
 *
 * This exists because `currentPayable` is derived, not stored — the only way to
 * trust it is to be able to see the rows it came from. The running column is
 * the same arithmetic the service does: opening, then + purchases, − payments.
 */
const SupplierLedgerSheet = ({ open, onOpenChange, supplier }: SupplierLedgerSheetProps) => {
  const { data, isLoading } = useQuery({
    queryKey: ["supplier-ledger", supplier.id],
    queryFn: () => getSupplierLedger(supplier.id),
    enabled: open,
  });

  const rows = data?.data.rows ?? [];
  const current = data?.data.supplier ?? supplier;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{current.name}</SheetTitle>
          <SheetDescription>
            {current.currentPayable >= 0 ? (
              <>
                You owe{" "}
                <span className="font-medium text-foreground">
                  {formatCurrency(current.currentPayable)}
                </span>
              </>
            ) : (
              <>
                <span className="font-medium text-foreground">
                  {formatCurrency(Math.abs(current.currentPayable))}
                </span>{" "}
                advance sitting with them
              </>
            )}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <dl className="mb-4 grid grid-cols-3 gap-3 rounded-lg border bg-muted/30 p-3 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Opening</dt>
              <dd className="font-medium tabular-nums">
                {formatCurrency(current.openingPayable)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Purchased</dt>
              <dd className="font-medium tabular-nums">
                {formatCurrency(current.totalPurchase)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Paid</dt>
              <dd className="font-medium tabular-nums text-success">
                {formatCurrency(current.totalPaid)}
              </dd>
            </div>
          </dl>

          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader size={28} label="Loading statement" />
            </div>
          ) : rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No movements yet.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="border-b">
                    <th className="px-3 py-2 text-left font-medium whitespace-nowrap">Date</th>
                    <th className="px-3 py-2 text-left font-medium">Detail</th>
                    <th className="px-3 py-2 text-right font-medium whitespace-nowrap">
                      Purchase
                    </th>
                    <th className="px-3 py-2 text-right font-medium whitespace-nowrap">Paid</th>
                    <th className="px-3 py-2 text-right font-medium whitespace-nowrap">Owed</th>
                  </tr>
                </thead>

                <tbody>
                  {rows.map((row, index) => (
                    // No stable id on a ledger row — it is a computed statement,
                    // not a table, so the index is the identity here.
                    <tr key={`${row.type}-${row.date}-${index}`} className="border-b last:border-0">
                      <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                        {formatDate(row.date)}
                      </td>
                      <td className="px-3 py-2">
                        <Badge
                          variant="outline"
                          className={cn("mr-2 border-transparent", TYPE_TONES[row.type])}
                        >
                          {TYPE_LABELS[row.type]}
                        </Badge>
                        <span className="text-muted-foreground">{row.description}</span>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {row.debit ? formatCurrency(row.debit) : "—"}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-success">
                        {row.credit ? formatCurrency(row.credit) : "—"}
                      </td>
                      <td className="px-3 py-2 text-right font-medium tabular-nums">
                        {formatCurrency(row.runningPayable)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SupplierLedgerSheet;
