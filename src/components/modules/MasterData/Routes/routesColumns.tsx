import DateCell from "@/components/shared/cell/DateCell";
import { truncate } from "@/lib/format";
import { type AppColumnDef } from "@/lib/table/features";
import { type IRoute } from "@/types/masterData.types";

export const routesColumns: AppColumnDef<IRoute>[] = [
  {
    id: "name",
    accessorKey: "name",
    header: "Sector",
    cell: ({ row }) => (
      // Monospaced so the airport codes line up down the column — "DAC-SIN"
      // over "DAC-KUL" over "YYZ-DAC-YYZ" is much easier to scan this way.
      <span className="font-mono text-sm font-medium tracking-wide">{row.original.name}</span>
    ),
  },
  {
    id: "remark",
    accessorKey: "remark",
    header: "Remark",
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.remark ? truncate(row.original.remark, 80) : "—"}
      </span>
    ),
  },
  {
    id: "createdAt",
    accessorKey: "createdAt",
    header: "Added",
    cell: ({ row }) => <DateCell date={row.original.createdAt} />,
  },
];
