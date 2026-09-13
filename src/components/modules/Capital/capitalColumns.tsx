import DateCell from "@/components/shared/cell/DateCell";
import MoneyCell from "@/components/shared/cell/MoneyCell";
import StatusBadge from "@/components/shared/cell/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { truncate } from "@/lib/format";
import { type AppColumnDef } from "@/lib/table/features";
import { type ICapitalFlow, type IProfitWithdrawal } from "@/types/capital.types";
import { CAPITAL_FLOW_TYPE_LABELS } from "@/types/enums.types";

export const capitalFlowColumns: AppColumnDef<ICapitalFlow>[] = [
  {
    id: "date",
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => <DateCell date={row.original.date} />,
  },
  {
    id: "ownerName",
    accessorKey: "ownerName",
    header: "Owner",
    cell: ({ row }) => <span className="text-sm font-medium">{row.original.ownerName}</span>,
  },
  {
    id: "type",
    accessorKey: "type",
    header: "Direction",
    cell: ({ row }) => (
      <StatusBadge
        label={CAPITAL_FLOW_TYPE_LABELS[row.original.type]}
        // Money in is good for the business, money out reduces the stake.
        tone={row.original.type === "INVEST" ? "success" : "warning"}
      />
    ),
  },
  {
    id: "cashAccount.name",
    header: "Account",
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
        {row.original.note ? truncate(row.original.note, 50) : "—"}
      </span>
    ),
  },
];

export const profitWithdrawalColumns: AppColumnDef<IProfitWithdrawal>[] = [
  {
    id: "date",
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => <DateCell date={row.original.date} />,
  },
  {
    id: "receivedBy",
    accessorKey: "receivedBy",
    header: "Received by",
    cell: ({ row }) => <span className="text-sm font-medium">{row.original.receivedBy}</span>,
  },
  {
    id: "cashAccount.name",
    header: "Account",
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
        {row.original.note ? truncate(row.original.note, 50) : "—"}
      </span>
    ),
  },
];
