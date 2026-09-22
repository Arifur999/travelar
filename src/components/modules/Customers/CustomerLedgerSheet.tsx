"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatCurrency } from "@/lib/format";
import { type ICustomer } from "@/types/customer.types";
import CustomerStatement from "./CustomerStatement";

interface CustomerLedgerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: ICustomer;
}

/**
 * One customer's statement, opened from their row.
 *
 * The statement itself lives in CustomerStatement, which the Ledger page uses
 * too — so a balance reads the same whichever way it was opened.
 */
const CustomerLedgerSheet = ({ open, onOpenChange, customer }: CustomerLedgerSheetProps) => (
  <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent className="w-full gap-0 sm:max-w-2xl">
      <SheetHeader>
        <SheetTitle>{customer.name}</SheetTitle>
        <SheetDescription>
          {customer.currentDue >= 0 ? (
            <>
              Owes{" "}
              <span className="font-medium text-foreground">
                {formatCurrency(customer.currentDue)}
              </span>
            </>
          ) : (
            <>
              <span className="font-medium text-foreground">
                {formatCurrency(Math.abs(customer.currentDue))}
              </span>{" "}
              in credit
            </>
          )}{" "}
          · {customer.phone}
        </SheetDescription>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <CustomerStatement customer={customer} enabled={open} />
      </div>
    </SheetContent>
  </Sheet>
);

export default CustomerLedgerSheet;
