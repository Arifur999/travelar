import DateCell from "@/components/shared/cell/DateCell";
import MoneyCell from "@/components/shared/cell/MoneyCell";
import { Badge } from "@/components/ui/badge";
import { truncate } from "@/lib/format";
import { type AppColumnDef } from "@/lib/table/features";
import { type IExpense } from "@/types/expense.types";

export const expensesColumns: AppColumnDef<IExpense>[] = [
  {
    id: "date",
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => <DateCell date={row.original.date} />,
  },
  {
    id: "category.name",
    header: "Category",
    // A relation field; QueryBuilder builds a flat orderBy.
    enableSorting: false,
    cell: ({ row }) => {
      const { category } = row.original;

      return (
        <div className="flex items-center gap-2">
          {/* The swatch comes from the API as a hex string, so it has to be an
              inline style — Tailwind cannot see a runtime colour. */}
          <span
            className="size-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: category.color ?? "var(--muted-foreground)" }}
            aria-hidden="true"
          />
          <span className="text-sm font-medium">{category.name}</span>
        </div>
      );
    },
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
    id: "notes",
    accessorKey: "notes",
    header: "Notes",
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.notes ? truncate(row.original.notes, 60) : "—"}
      </span>
    ),
  },
];
