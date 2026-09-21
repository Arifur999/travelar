"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Receipt } from "lucide-react";
import WalletStatementSheet from "@/components/modules/Wallet/WalletStatementSheet";
import Loader from "@/components/shared/Loader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/format";
import { unspentShare } from "@/lib/walletCharts";
import { getWalletHolders } from "@/services/wallet.services";
import { type IWalletHolder } from "@/types/wallet.types";

/**
 * Everyone in credit, largest first — the order the API returns.
 *
 * Filtered in the browser rather than on the server: this is one row per
 * customer holding money, a small fraction of the customer list, and the whole
 * of it already arrived.
 */
const WalletHoldersTable = () => {
  const [search, setSearch] = useState("");
  const [statementFor, setStatementFor] = useState<IWalletHolder | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["wallet-holders"],
    queryFn: () => getWalletHolders(),
  });

  const holders = useMemo(() => data?.data ?? [], [data]);
  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return holders;
    return holders.filter(
      (holder) =>
        holder.name.toLowerCase().includes(term) || holder.phone.toLowerCase().includes(term),
    );
  }, [holders, search]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Customer balances</CardTitle>
          <CardDescription>
            Money already banked. Settling an invoice from a balance marks it paid without moving
            cash again — the money arrived when it was paid in.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or phone"
            className="sm:max-w-xs"
            aria-label="Search customers in credit"
          />

          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader size={28} label="Loading balances" />
            </div>
          ) : rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {holders.length === 0
                ? "No customer is in credit. Take a collection before there is an invoice and it will show up here."
                : "No customer matches that search."}
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="border-b">
                    <th className="px-3 py-2 text-left font-medium">Customer</th>
                    <th className="px-3 py-2 text-right font-medium whitespace-nowrap">Paid in</th>
                    <th className="px-3 py-2 text-right font-medium whitespace-nowrap">Used up</th>
                    <th className="px-3 py-2 text-right font-medium whitespace-nowrap">Balance</th>
                    <th className="px-3 py-2 text-right font-medium">
                      <span className="sr-only">Statement</span>
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {rows.map((holder) => {
                    const left = unspentShare(holder);

                    return (
                      <tr key={holder.customerId} className="border-b last:border-0">
                        <td className="px-3 py-2">
                          <span className="font-medium">{holder.name}</span>
                          <span className="ml-2 text-xs text-muted-foreground">{holder.phone}</span>
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {formatCurrency(holder.paidIn)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                          {holder.usedUp ? formatCurrency(holder.usedUp) : "—"}
                        </td>
                        <td className="px-3 py-2 text-right font-medium tabular-nums text-success">
                          {formatCurrency(holder.balance)}
                          {left !== null && left < 100 && (
                            <span className="ml-1 text-xs font-normal text-muted-foreground">
                              ({Math.round(left)}% left)
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setStatementFor(holder)}
                          >
                            <Receipt className="size-4" aria-hidden="true" />
                            Statement
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {statementFor && (
        <WalletStatementSheet
          open={statementFor !== null}
          onOpenChange={(open) => !open && setStatementFor(null)}
          holder={statementFor}
        />
      )}
    </>
  );
};

export default WalletHoldersTable;
