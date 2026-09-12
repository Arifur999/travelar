import DateCell from "@/components/shared/cell/DateCell";
import MoneyCell from "@/components/shared/cell/MoneyCell";
import StatusBadge from "@/components/shared/cell/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { type AppColumnDef } from "@/lib/table/features";
import { TICKET_STATUS_LABELS, TICKET_STATUS_TONES } from "@/types/enums.types";
import { type ITicket } from "@/types/ticket.types";

export const ticketsColumns: AppColumnDef<ITicket>[] = [
  {
    id: "pnr",
    accessorKey: "pnr",
    header: "PNR",
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="font-mono text-sm font-medium tracking-wide">{row.original.pnr}</p>
        <p className="truncate text-xs text-muted-foreground">{row.original.passengerName}</p>
      </div>
    ),
  },
  {
    id: "customer.name",
    header: "Customer",
    // A relation field — QueryBuilder's sortBy builds a flat orderBy.
    enableSorting: false,
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="truncate text-sm">{row.original.customer.name}</p>
        <p className="truncate text-xs text-muted-foreground">{row.original.customer.phone}</p>
      </div>
    ),
  },
  {
    id: "airline",
    header: "Flight",
    enableSorting: false,
    cell: ({ row }) => {
      const { airline, route } = row.original;

      if (!airline && !route) return <span className="text-muted-foreground">—</span>;

      return (
        <div className="flex flex-col gap-1">
          {airline && (
            <Badge variant="secondary" className="w-fit font-mono tracking-wider">
              {airline.shortCode}
            </Badge>
          )}
          {route && <span className="font-mono text-xs">{route.name}</span>}
        </div>
      );
    },
  },
  {
    id: "travelDate",
    accessorKey: "travelDate",
    header: "Travel",
    cell: ({ row }) => (
      <div>
        <DateCell date={row.original.travelDate} />
        {/* A recorded date change is worth flagging in the list: it is the one
            event that adds money to both sides of an existing sale. */}
        {row.original.dateChangedAt && (
          <p className="text-xs text-warning">changed {row.original.dateChangedAt.slice(0, 10)}</p>
        )}
      </div>
    ),
  },
  {
    id: "customerCharge",
    header: "Charged",
    // Derived (fare + dateChangeFee − refundAmount), so there is no SQL column.
    enableSorting: false,
    cell: ({ row }) => <MoneyCell value={row.original.customerCharge} />,
  },
  {
    id: "profit",
    accessorKey: "profit",
    header: "Profit",
    // Stored, so sortable — but only ever written by the service from the
    // additive formula, never by a client.
    cell: ({ row }) => <MoneyCell value={row.original.profit} signed />,
  },
  {
    id: "dueAmount",
    header: "Due",
    enableSorting: false,
    cell: ({ row }) => <MoneyCell value={row.original.dueAmount} signed invert />,
  },
  {
    id: "status",
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <StatusBadge
        label={TICKET_STATUS_LABELS[row.original.status]}
        tone={TICKET_STATUS_TONES[row.original.status]}
      />
    ),
  },
];
