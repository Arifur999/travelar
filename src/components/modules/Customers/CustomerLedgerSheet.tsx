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
import { type CustomerLedgerRowType, type ICustomer } from "@/types/customer.types";

interface CustomerLedgerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: ICustomer;
}

const TYPE_LABELS: Record<CustomerLedgerRowType, string> = {
  opening: "Opening",
  ticket: "Ticket",
  "ticket-payment": "Payment",
  visa: "Visa",
  "visa-payment": "Payment",
  hajj: "Hajj",
  "hajj-payment": "Payment",
  tour: "Tour",
  "tour-payment": "Payment",
  hotel: "Hotel",
  "hotel-payment": "Payment",
  "due-received": "Collection",
  discount: "Discount",
};

/**
 * Sales take their module's accent, so a mixed statement reads at a glance;
 * every kind of money in is green, whichever module it was paid against.
 */
const TYPE_TONES: Record<CustomerLedgerRowType, string> = {
  opening: "bg-muted text-muted-foreground",
  ticket: "bg-primary/10 text-primary",
  "ticket-payment": "bg-success/10 text-success",
  visa: "bg-visa/10 text-visa",
  "visa-payment": "bg-success/10 text-success",
  hajj: "bg-hajj/10 text-hajj",
  "hajj-payment": "bg-success/10 text-success",
  tour: "bg-chart-4/10 text-chart-4",
  "tour-payment": "bg-success/10 text-success",
  hotel: "bg-chart-2/10 text-chart-2",
  "hotel-payment": "bg-success/10 text-success",
  "due-received": "bg-success/10 text-success",
  discount: "bg-info/10 text-info",
};

/**
 * The statement behind the due figure: tickets, visa cases, Hajj bookings,
 * the payments against each, collections and discounts — everything that
 * feeds `currentDue`, so the running total ends on it.
 */
const CustomerLedgerSheet = ({ open, onOpenChange, customer }: CustomerLedgerSheetProps) => {
  const { data, isLoading } = useQuery({
    queryKey: ["customer-ledger", customer.id],
    queryFn: () => getCustomerLedger(customer.id),
    enabled: open,
  });

  const rows = data?.data.rows ?? [];
  const current = data?.data.customer ?? customer;

  // Kept as a guard even though the API now builds both from the same rows:
  // if the two derivations ever drift again, say so instead of showing two
  // numbers that silently disagree.
  const lastRunning = rows.length > 0 ? rows[rows.length - 1]!.runningDue : null;
  const statementDisagrees =
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

          {statementDisagrees && (
            <p className="mb-3 rounded-md border border-warning/30 bg-warning/10 p-3 text-xs">
              This statement ends at {formatCurrency(lastRunning)}, but the balance above is{" "}
              {formatCurrency(current.currentDue)}. One of the two is out of date — please report
              it to support.
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
