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
import { getCustomerLedger } from "@/services/customer.services";
import { type ICustomer, type ICustomerLedgerRow } from "@/types/customer.types";

interface CustomerLedgerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: ICustomer;
}

const TYPE_LABELS: Record<ICustomerLedgerRow["type"], string> = {
  opening: "Opening",
  ticket: "Ticket",
  payment: "Payment",
  "due-received": "Collection",
  discount: "Discount",
};

const TYPE_TONES: Record<ICustomerLedgerRow["type"], string> = {
  opening: "bg-muted text-muted-foreground",
  ticket: "bg-warning/10 text-warning",
  payment: "bg-success/10 text-success",
  "due-received": "bg-success/10 text-success",
  discount: "bg-info/10 text-info",
};

/**
 * The statement behind the due figure.
 *
 * Note what it does NOT yet include: visa cases and Hajj bookings contribute to
 * `currentDue` (the API sums all three modules), but the ledger endpoint only
 * lists tickets, payments, collections and discounts. So on a customer with
 * visa or Hajj sales, the final running total will be lower than the headline.
 * That gap is in the API, not here — the sheet says so rather than quietly
 * showing two numbers that disagree.
 */
const CustomerLedgerSheet = ({ open, onOpenChange, customer }: CustomerLedgerSheetProps) => {
  const { data, isLoading } = useQuery({
    queryKey: ["customer-ledger", customer.id],
    queryFn: () => getCustomerLedger(customer.id),
    enabled: open,
  });

  const rows = data?.data.rows ?? [];
  const current = data?.data.customer ?? customer;

  const lastRunning = rows.length > 0 ? rows[rows.length - 1]!.runningDue : null;
  const statementIsPartial =
    lastRunning !== null && Math.abs(lastRunning - current.currentDue) > 0.01;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{current.name}</SheetTitle>
          <SheetDescription>
            {current.currentDue >= 0 ? (
              <>
                Owes{" "}
                <span className="font-medium text-foreground">
                  {formatCurrency(current.currentDue)}
                </span>
              </>
            ) : (
              <>
                <span className="font-medium text-foreground">
                  {formatCurrency(Math.abs(current.currentDue))}
                </span>{" "}
                in credit
              </>
            )}{" "}
            · {current.phone}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <dl className="mb-4 grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-xs text-muted-foreground">Opening</dt>
              <dd className="font-medium tabular-nums">{formatCurrency(current.openingDue)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Billed</dt>
              <dd className="font-medium tabular-nums">
                {formatCurrency(current.totalPurchase)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Collected</dt>
              <dd className="font-medium tabular-nums text-success">
                {formatCurrency(current.collectionsAmount)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Discount</dt>
              <dd className="font-medium tabular-nums">
                {formatCurrency(current.totalDiscount)}
              </dd>
            </div>
          </dl>

          {statementIsPartial && (
            <p className="mb-3 rounded-md border border-warning/30 bg-warning/10 p-3 text-xs">
              This statement lists tickets, payments, collections and discounts. Visa and Hajj
              sales are counted in the balance above but are not itemised here, so the running
              total ends at {formatCurrency(lastRunning)} rather than{" "}
              {formatCurrency(current.currentDue)}.
            </p>
          )}

          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader size={28} label="Loading statement" />
            </div>
          ) : rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No movements yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="border-b">
                    <th className="px-3 py-2 text-left font-medium whitespace-nowrap">Date</th>
                    <th className="px-3 py-2 text-left font-medium">Detail</th>
                    <th className="px-3 py-2 text-right font-medium whitespace-nowrap">Billed</th>
                    <th className="px-3 py-2 text-right font-medium whitespace-nowrap">
                      Received
                    </th>
                    <th className="px-3 py-2 text-right font-medium whitespace-nowrap">Due</th>
                  </tr>
                </thead>

                <tbody>
                  {rows.map((row, index) => (
                    // A computed statement has no row ids, so position is the
                    // identity here.
                    <tr
                      key={`${row.type}-${row.date}-${index}`}
                      className="border-b last:border-0"
                    >
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
                        {formatCurrency(row.runningDue)}
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

export default CustomerLedgerSheet;
