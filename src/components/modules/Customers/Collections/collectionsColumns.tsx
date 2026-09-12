import DateCell from "@/components/shared/cell/DateCell";
import MoneyCell from "@/components/shared/cell/MoneyCell";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, toNumber, truncate } from "@/lib/format";
import { type AppColumnDef } from "@/lib/table/features";
import { type IDueReceived } from "@/types/customer.types";

export const collectionsColumns: AppColumnDef<IDueReceived>[] = [
  {
    id: "date",
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => <DateCell date={row.original.date} />,
  },
  {
    id: "customer.name",
    header: "Customer",
    // A relation field; QueryBuilder builds a flat orderBy, so not sortable.
    enableSorting: false,
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{row.original.customer.name}</p>
        <p className="truncate text-xs text-muted-foreground">{row.original.customer.phone}</p>
      </div>
    ),
  },
  {
    id: "received",
    header: "Received",
    enableSorting: false,
    cell: ({ row }) => {
      // amount1 and amount2 are raw Decimal strings, so both go through
      // toNumber before being added — "500" + "300" would be "500300".
      const total = toNumber(row.original.amount1) + toNumber(row.original.amount2);
      return <MoneyCell value={total} />;
    },
  },
  {
    id: "into",
    header: "Into",
    enableSorting: false,
    cell: ({ row }) => {
      const { cashAccount1, cashAccount2, amount2 } = row.original;
      const hasSplit = Boolean(cashAccount2) && toNumber(amount2) > 0;

      return (
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline" className="whitespace-nowrap">
            {cashAccount1.name} {formatCurrency(row.original.amount1)}
          </Badge>
          {hasSplit && (
            <Badge variant="outline" className="whitespace-nowrap">
              {cashAccount2!.name} {formatCurrency(amount2)}
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    id: "discount",
    accessorKey: "discount",
    header: "Discount",
    enableSorting: false,
    cell: ({ row }) => {
      const discount = toNumber(row.original.discount);
      if (discount === 0) return <span className="text-muted-foreground">—</span>;

      return (
        <div className="text-right">
          <MoneyCell value={discount} className="text-info" />
          {row.original.discountCategory && (
            <p className="text-xs text-muted-foreground">{row.original.discountCategory}</p>
          )}
        </div>
      );
    },
  },
  {
    id: "notes",
    accessorKey: "notes",
    header: "Notes",
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.notes ? truncate(row.original.notes, 50) : "—"}
      </span>
    ),
  },
];
