import MoneyCell from "@/components/shared/cell/MoneyCell";
import StatusBadge from "@/components/shared/cell/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { type AppColumnDef } from "@/lib/table/features";
import { type IAccountBalance } from "@/types/account.types";
import { CASH_ACCOUNT_CATEGORY_LABELS } from "@/types/enums.types";

export const cashAccountsColumns: AppColumnDef<IAccountBalance>[] = [
  {
    id: "name",
    accessorKey: "name",
    header: "Account",
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },
  {
    id: "category",
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => (
      <Badge variant="outline">{CASH_ACCOUNT_CATEGORY_LABELS[row.original.category]}</Badge>
    ),
  },
  {
    id: "openingBalance",
    accessorKey: "openingBalance",
    header: "Opening",
    cell: ({ row }) => (
      <MoneyCell value={row.original.openingBalance} className="text-muted-foreground" />
    ),
  },
  {
    id: "totalIn",
    accessorKey: "totalIn",
    header: "In",
    cell: ({ row }) => <MoneyCell value={row.original.totalIn} className="text-success" />,
  },
  {
    id: "totalOut",
    accessorKey: "totalOut",
    header: "Out",
    cell: ({ row }) => <MoneyCell value={row.original.totalOut} className="text-destructive" />,
  },
  {
    id: "currentBalance",
    accessorKey: "currentBalance",
    header: "Balance",
    // totalIn − totalOut. The opening balance is already an OPENING posting
    // inside totalIn, so it must NOT be added again here.
    cell: ({ row }) => <MoneyCell value={row.original.currentBalance} signed />,
  },
  {
    id: "isActive",
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) =>
      row.original.isActive ? (
        <StatusBadge label="Active" tone="success" />
      ) : (
        <StatusBadge label="Archived" tone="neutral" />
      ),
  },
];
