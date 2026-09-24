import { RiFlightTakeoffLine } from "@remixicon/react";
import DateCell from "@/components/shared/cell/DateCell";
import { Badge } from "@/components/ui/badge";
import { truncate } from "@/lib/format";
import { type AppColumnDef } from "@/lib/table/features";
import { type IAirline } from "@/types/masterData.types";

/**
 * A plain data export — no `"use client"`. It is imported by a client
 * component, which is what puts it in the client bundle.
 *
 * Every `accessorKey` here must be a real sortable column on the backend:
 * sorting sends `?sortBy=<id>` straight into Prisma's orderBy, so a made-up id
 * would be a 500 rather than a silent no-op.
 */
export const airlinesColumns: AppColumnDef<IAirline>[] = [
  {
    id: "shortCode",
    accessorKey: "shortCode",
    header: "Code",
    cell: ({ row }) => (
      <Badge variant="secondary" className="font-mono tracking-wider">
        {row.original.shortCode}
      </Badge>
    ),
  },
  {
    id: "name",
    accessorKey: "name",
    header: "Airline",
    cell: ({ row }) => {
      const airline = row.original;

      return (
        <div className="flex items-center gap-2">
          <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-primary">
            {airline.logoUrl ? (
              /* An arbitrary external logo URL cannot be pre-declared in
                 next.config, so next/image would reject it at runtime. */
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={airline.logoUrl}
                alt=""
                className="size-full object-cover"
                loading="lazy"
              />
            ) : (
              <RiFlightTakeoffLine className="size-4" aria-hidden="true" />
            )}
          </span>
          <span className="font-medium">{airline.name}</span>
        </div>
      );
    },
  },
  {
    id: "remark",
    accessorKey: "remark",
    header: "Remark",
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.remark ? truncate(row.original.remark, 60) : "—"}
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
