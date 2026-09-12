import DateCell from "@/components/shared/cell/DateCell";
import MoneyCell from "@/components/shared/cell/MoneyCell";
import { Badge } from "@/components/ui/badge";
import { truncate } from "@/lib/format";
import { type AppColumnDef } from "@/lib/table/features";
import { type ISupplierTransaction } from "@/types/supplier.types";

export const supplierPaymentsColumns: AppColumnDef<ISupplierTransaction>[] = [
  {
    id: "date",
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => <DateCell date={row.original.date} />,
  },
  {
    id: "supplier.name",
    header: "Supplier",
    // A relation field. QueryBuilder's sortBy builds a flat orderBy, so
    // sorting on this would need a nested orderBy it does not produce.
    enableSorting: false,
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{row.original.supplier.name}</p>
        {row.original.supplier.phone && (
          <p className="truncate text-xs text-muted-foreground">{row.original.supplier.phone}</p>
        )}
      </div>
    ),
  },
  {
    id: "cashAccount.name",
    header: "Paid from",
    enableSorting: false,
    cell: ({ row }) => <Badge variant="outline">{row.original.cashAccount.name}</Badge>,
  },
  {
    id: "amount",
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => <MoneyCell value={row.original.amount} />,
  },
  {
    id: "note",
    accessorKey: "note",
    header: "Note",
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.note ? truncate(row.original.note, 60) : "—"}
      </span>
    ),
  },
];
