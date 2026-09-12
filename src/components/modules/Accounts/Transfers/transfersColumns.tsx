import { ArrowRight } from "lucide-react";
import DateCell from "@/components/shared/cell/DateCell";
import MoneyCell from "@/components/shared/cell/MoneyCell";
import { truncate } from "@/lib/format";
import { type AppColumnDef } from "@/lib/table/features";
import { type IBalanceTransfer } from "@/types/account.types";

export const transfersColumns: AppColumnDef<IBalanceTransfer>[] = [
  {
    id: "date",
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => <DateCell date={row.original.date} />,
  },
  {
    id: "fromAccount.name",
    header: "Movement",
    // Sorting on a relation field would need orderBy on the nested relation,
    // which QueryBuilder's flat sortBy does not build — so this is display only.
    enableSorting: false,
    cell: ({ row }) => (
      <div className="flex items-center gap-2 text-sm whitespace-nowrap">
        <span className="font-medium">{row.original.fromAccount.name}</span>
        <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="font-medium">{row.original.toAccount.name}</span>
      </div>
    ),
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
