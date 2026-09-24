import DateCell from "@/components/shared/cell/DateCell";
import MoneyCell from "@/components/shared/cell/MoneyCell";
import StatusBadge from "@/components/shared/cell/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/format";
import { type AppColumnDef } from "@/lib/table/features";
import {
  HAJJ_BATCH_STATUS_LABELS,
  HAJJ_BOOKING_STATUS_LABELS,
  HAJJ_BOOKING_STATUS_TONES,
  HAJJ_PACKAGE_TYPE_LABELS,
  HAJJ_TIER_LABELS,
} from "@/types/enums.types";
import {
  type IHajjBatch,
  type IHajjBooking,
  type IHajjPackage,
} from "@/types/hajj.types";

export const hajjBookingsColumns: AppColumnDef<IHajjBooking>[] = [
  {
    id: "pilgrimName",
    accessorKey: "pilgrimName",
    header: "Pilgrim",
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{row.original.pilgrimName}</p>
        <p className="truncate text-xs text-muted-foreground">
          {row.original.passportNumber || row.original.customer.name}
        </p>
      </div>
    ),
  },
  {
    id: "hajjPackage.name",
    header: "Package",
    // A relation field; QueryBuilder builds a flat orderBy.
    enableSorting: false,
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="truncate text-sm">{row.original.hajjPackage.name}</p>
        <p className="text-xs text-muted-foreground">
          {HAJJ_PACKAGE_TYPE_LABELS[row.original.hajjPackage.type]}
          {row.original.hajjPackage.tier
            ? ` · ${HAJJ_TIER_LABELS[row.original.hajjPackage.tier]}`
            : ""}
        </p>
      </div>
    ),
  },
  {
    id: "batch.name",
    header: "Batch",
    enableSorting: false,
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="truncate text-sm">{row.original.batch.name}</p>
        <p className="text-xs text-muted-foreground">
          <DateCell date={row.original.batch.departureDate} />
        </p>
      </div>
    ),
  },
  {
    id: "rooms",
    header: "Rooms",
    enableSorting: false,
    cell: ({ row }) => {
      const { makkahRoom, madinahRoom } = row.original;
      if (!makkahRoom && !madinahRoom) {
        return <span className="text-xs text-muted-foreground">Unassigned</span>;
      }

      return (
        <div className="flex flex-wrap gap-1">
          {makkahRoom && (
            <Badge variant="outline" className="text-xs">
              Makkah {makkahRoom.roomNumber}
            </Badge>
          )}
          {madinahRoom && (
            <Badge variant="outline" className="text-xs">
              Madinah {madinahRoom.roomNumber}
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    id: "docs",
    header: "Docs",
    enableSorting: false,
    cell: ({ row }) => {
      const { received, total } = row.original.documentsProgress;

      return (
        <Badge
          variant="outline"
          className={total > 0 && received === total ? "border-success/30 text-success" : ""}
        >
          {received}/{total}
        </Badge>
      );
    },
  },
  {
    id: "packagePrice",
    accessorKey: "packagePrice",
    header: "Price",
    // Snapshotted at booking time, so this is a real stored column.
    cell: ({ row }) => <MoneyCell value={row.original.packagePrice} />,
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
        label={HAJJ_BOOKING_STATUS_LABELS[row.original.status]}
        tone={HAJJ_BOOKING_STATUS_TONES[row.original.status]}
      />
    ),
  },
];

export const hajjPackagesColumns: AppColumnDef<IHajjPackage>[] = [
  {
    id: "name",
    accessorKey: "name",
    header: "Package",
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{row.original.name}</p>
        <p className="text-xs text-muted-foreground">
          {HAJJ_PACKAGE_TYPE_LABELS[row.original.type]}
          {row.original.tier ? ` · ${HAJJ_TIER_LABELS[row.original.tier]}` : ""}
          {row.original.durationDays ? ` · ${row.original.durationDays} days` : ""}
        </p>
      </div>
    ),
  },
  {
    id: "hotels",
    header: "Hotels",
    enableSorting: false,
    cell: ({ row }) => (
      <div className="min-w-0 text-xs text-muted-foreground">
        <p className="truncate">Makkah: {row.original.makkahHotel || "—"}</p>
        <p className="truncate">Madinah: {row.original.madinahHotel || "—"}</p>
      </div>
    ),
  },
  {
    id: "price",
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => <MoneyCell value={row.original.price} />,
  },
  {
    id: "isActive",
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) =>
      row.original.isActive ? (
        <StatusBadge label="Active" tone="success" />
      ) : (
        <StatusBadge label="Retired" tone="neutral" />
      ),
  },
];

export const hajjBatchesColumns: AppColumnDef<IHajjBatch>[] = [
  {
    id: "name",
    accessorKey: "name",
    header: "Batch",
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{row.original.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {row.original.hajjPackage?.name ?? "—"}
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
      const { bookedSeats, seatCapacity, availableSeats } = row.original;
      const full = availableSeats === 0;

      return (
        <div className="min-w-0">
          <p className="text-sm tabular-nums">
            {formatNumber(bookedSeats)} / {formatNumber(seatCapacity)}
          </p>
          <p className={full ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
            {/* Counts live bookings only — a cancelled pilgrim frees their bed. */}
            {full ? "Full" : `${formatNumber(availableSeats)} free`}
          </p>
        </div>
      );
    },
  },
  {
    id: "status",
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant="outline">{HAJJ_BATCH_STATUS_LABELS[row.original.status]}</Badge>
    ),
  },
];
