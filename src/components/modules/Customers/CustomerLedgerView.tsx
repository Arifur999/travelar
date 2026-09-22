"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import SearchableSelect from "@/components/shared/form/SearchableSelect";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/format";
import { customerOptions } from "@/lib/pickerOptions";
import { getCustomerDashboard } from "@/services/customer.services";
import CustomerStatement from "./CustomerStatement";

/**
 * One customer's ledger on a page of its own.
 *
 * The same statement is a sheet on the customers table, which is the quick
 * way in. This is the other way round — you know whose ledger you want before
 * you know where they are in the list — and it is the one an agent reads out
 * over the phone, so it gets the width of the page.
 */
const CustomerLedgerView = () => {
  const [customerId, setCustomerId] = useState("");

  const { data } = useQuery({
    queryKey: ["customer-dashboard"],
    queryFn: () => getCustomerDashboard(),
  });

  const customers = data?.data.data ?? [];
  const selected = customers.find((customer) => customer.id === customerId) ?? null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer ledger</CardTitle>
        <CardDescription>
          Every sale, payment, collection and discount against one customer, oldest first. The
          running total ends on exactly what they owe today.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="max-w-sm space-y-1.5">
          <Label htmlFor="ledger-customer">Customer</Label>
          <SearchableSelect
            id="ledger-customer"
            value={customerId}
            onChange={setCustomerId}
            // With the due beside each name, the person you are chasing is
            // usually the one you can already see.
            options={customerOptions(customers, { showDue: true })}
            placeholder="Pick a customer"
            searchPlaceholder="Search by name, phone or passport…"
            emptyText="No customer matches."
            loading={!data}
          />
        </div>

        {selected ? (
          <div>
            <p className="mb-3 text-sm">
              <span className="font-medium">{selected.name}</span>
              <span className="text-muted-foreground"> · {selected.phone} · </span>
              {selected.currentDue >= 0 ? (
                <>
                  owes{" "}
                  <span className="font-medium">{formatCurrency(selected.currentDue)}</span>
                </>
              ) : (
                <>
                  <span className="font-medium">
                    {formatCurrency(Math.abs(selected.currentDue))}
                  </span>{" "}
                  in credit
                </>
              )}
            </p>

            <CustomerStatement key={selected.id} customer={selected} />
          </div>
        ) : (
          <div className="flex h-40 items-center justify-center rounded-lg border border-dashed">
            <p className="text-sm text-muted-foreground">
              Pick a customer to read their statement.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomerLedgerView;
