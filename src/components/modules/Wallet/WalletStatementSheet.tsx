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
import { getWalletStatement } from "@/services/wallet.services";
import { type IWalletHolder } from "@/types/wallet.types";

interface WalletStatementSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  holder: IWalletHolder;
}

/**
 * Where one customer's balance came from and what has eaten into it.
 *
 * This is not the customer statement: it shows only money paid in and the
 * invoices settled from it. What the customer owes overall — including
 * invoices nobody has applied this balance to yet — stays on their ledger.
 */
const WalletStatementSheet = ({ open, onOpenChange, holder }: WalletStatementSheetProps) => {
  const { data, isLoading } = useQuery({
    queryKey: ["wallet-statement", holder.customerId],
    queryFn: () => getWalletStatement(holder.customerId),
    enabled: open,
  });

  const statement = data?.data;
  const movements = statement?.movements ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{statement?.customer.name ?? holder.name}</SheetTitle>
          <SheetDescription>
            Holding{" "}
            <span className="font-medium text-foreground">
              {formatCurrency(statement?.balance ?? holder.balance)}
            </span>{" "}
            · {statement?.customer.phone ?? holder.phone}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <dl className="mb-4 grid grid-cols-3 gap-3 rounded-lg border bg-muted/30 p-3 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Paid in</dt>
              <dd className="font-medium tabular-nums text-success">
                {formatCurrency(statement?.paidIn ?? holder.paidIn)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Used up</dt>
              <dd className="font-medium tabular-nums">
                {formatCurrency(statement?.usedUp ?? holder.usedUp)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Left</dt>
              <dd className="font-medium tabular-nums">
                {formatCurrency(statement?.balance ?? holder.balance)}
              </dd>
            </div>
          </dl>

          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader size={28} label="Loading statement" />
            </div>
          ) : movements.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No movements yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="border-b">
                    <th className="px-3 py-2 text-left font-medium whitespace-nowrap">Date</th>
                    <th className="px-3 py-2 text-left font-medium">Detail</th>
                    <th className="px-3 py-2 text-right font-medium whitespace-nowrap">In</th>
                    <th className="px-3 py-2 text-right font-medium whitespace-nowrap">Out</th>
                    <th className="px-3 py-2 text-right font-medium whitespace-nowrap">Left</th>
                  </tr>
                </thead>

                <tbody>
                  {movements.map((movement) => (
                    <tr key={movement.id} className="border-b last:border-0">
                      <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                        {formatDate(movement.date)}
                      </td>
                      <td className="px-3 py-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "mr-2 border-transparent",
                            movement.type === "PAID_IN"
                              ? "bg-success/10 text-success"
                              : "bg-primary/10 text-primary",
                          )}
                        >
                          {movement.type === "PAID_IN" ? "Paid in" : "Used"}
                        </Badge>
                        <span className="text-muted-foreground">{movement.description}</span>
                      </td>
                      {/* Both columns always show a figure: the side this
                          movement is not shows 0, never a dash. */}
                      <td className="px-3 py-2 text-right tabular-nums text-success">
                        {formatCurrency(movement.type === "PAID_IN" ? movement.amount : 0)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatCurrency(movement.type === "SPENT" ? movement.amount : 0)}
                      </td>
                      <td className="px-3 py-2 text-right font-medium tabular-nums">
                        {formatCurrency(movement.balance)}
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

export default WalletStatementSheet;
