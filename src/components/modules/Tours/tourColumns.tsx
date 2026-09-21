import DateCell from "@/components/shared/cell/DateCell";
import MoneyCell from "@/components/shared/cell/MoneyCell";
import StatusBadge from "@/components/shared/cell/StatusBadge";
import { formatNumber } from "@/lib/format";
import { type AppColumnDef } from "@/lib/table/features";
import {
  TOUR_BOOKING_STATUS_LABELS,
  TOUR_BOOKING_STATUS_TONES,
  TOUR_STATUS_LABELS,
  TOUR_STATUS_TONES,
} from "@/types/enums.types";
import { type ITourBooking, type ITourPackage } from "@/types/tour.types";

export const tourBookingsColumns: AppColumnDef<ITourBooking>[] = [
  {
    id: "leadTraveller",
    accessorKey: "leadTraveller",
    header: "Lead traveller",
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{row.original.leadTraveller}</p>
        <p className="truncate text-xs text-muted-foreground">{row.original.customer.name}</p>
      </div>
    ),
  },
  {
    id: "tourPackage.name",
    header: "Tour",
    // A relation field; QueryBuilder builds a flat orderBy.
    enableSorting: false,
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="truncate text-sm">{row.original.tourPackage.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {row.original.tourPackage.destination}
        </p>
      </div>
    ),
  },
  {
    id: "departure",
    header: "Departs",
    enableSorting: false,
    cell: ({ row }) => <DateCell date={row.original.tourPackage.departureDate} />,
  },
  {
    id: "travellers",
    accessorKey: "travellers",
    header: "Seats",
    cell: ({ row }) => (
      <span className="tabular-nums">{formatNumber(row.original.travellers)}</span>
    ),
  },
  {
    id: "sellAmount",
    accessorKey: "sellAmount",
    header: "Price",
    // Snapshotted at booking time, so this is a real stored column.
    cell: ({ row }) => <MoneyCell value={row.original.sellAmount} />,
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
        label={TOUR_BOOKING_STATUS_LABELS[row.original.status]}
        tone={TOUR_BOOKING_STATUS_TONES[row.original.status]}
      />
    ),
  },
];

export const toursColumns: AppColumnDef<ITourPackage>[] = [
  {
    id: "name",
    accessorKey: "name",
    header: "Tour",
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{row.original.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {row.original.destination}
          {row.original.durationDays ? ` · ${row.original.durationDays} days` : ""}
        </p>
      </div>
    ),
  },
  {
    id: "departureDate",
    accessorKey: "departureDate",
    header: "Departs",
    cell: ({ row }) => <DateCell date={row.original.departureDate} />,
  },
  {
    id: "seats",
    header: "Seats",
    enableSorting: false,
    cell: ({ row }) => {
      const { seatsSold, seatCapacity, seatsLeft } = row.original;

      // No capacity set is not the same as full, so it never says "Full".
      if (seatCapacity === null) {
        return (
          <div className="min-w-0">
            <p className="text-sm tabular-nums">{formatNumber(seatsSold)} sold</p>
            <p className="text-xs text-muted-foreground">No seat limit</p>
          </div>
        );
      }

      const full = seatsLeft !== null && seatsLeft <= 0;

      return (
        <div className="min-w-0">
          <p className="text-sm tabular-nums">
            {formatNumber(seatsSold)} / {formatNumber(seatCapacity)}
          </p>
          <p className={full ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
            {/* Counts live bookings only — a cancellation frees its seats. */}
            {full ? "Full" : `${formatNumber(seatsLeft ?? 0)} free`}
          </p>
        </div>
      );
    },
  },
  {
    id: "pricePerPerson",
    accessorKey: "pricePerPerson",
    header: "Per person",
    cell: ({ row }) => <MoneyCell value={row.original.pricePerPerson} />,
  },
  {
    id: "status",
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <StatusBadge
        label={TOUR_STATUS_LABELS[row.original.status]}
        tone={TOUR_STATUS_TONES[row.original.status]}
      />
    ),
  },
];
