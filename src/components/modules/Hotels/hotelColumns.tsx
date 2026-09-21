import DateCell from "@/components/shared/cell/DateCell";
import MoneyCell from "@/components/shared/cell/MoneyCell";
import StatusBadge from "@/components/shared/cell/StatusBadge";
import { formatNumber } from "@/lib/format";
import { type AppColumnDef } from "@/lib/table/features";
import { HOTEL_BOOKING_STATUS_LABELS, HOTEL_BOOKING_STATUS_TONES } from "@/types/enums.types";
import { type IHotelBooking } from "@/types/hotel.types";

export const hotelBookingsColumns: AppColumnDef<IHotelBooking>[] = [
  {
    id: "guestName",
    accessorKey: "guestName",
    header: "Guest",
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{row.original.guestName}</p>
        <p className="truncate text-xs text-muted-foreground">{row.original.customer.name}</p>
      </div>
    ),
  },
  {
    id: "hotelName",
    accessorKey: "hotelName",
    header: "Hotel",
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="truncate text-sm">{row.original.hotelName}</p>
        <p className="truncate text-xs text-muted-foreground">
          {[row.original.city, row.original.country].filter(Boolean).join(", ")}
        </p>
      </div>
    ),
  },
  {
    id: "checkIn",
    accessorKey: "checkIn",
    header: "Stay",
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="text-sm whitespace-nowrap">
          <DateCell date={row.original.checkIn} /> → <DateCell date={row.original.checkOut} />
        </p>
        <p className="text-xs text-muted-foreground">
          {/* Counted from the dates, never stored. */}
          {formatNumber(row.original.nights)}{" "}
          {row.original.nights === 1 ? "night" : "nights"} · {formatNumber(row.original.rooms)}{" "}
          {row.original.rooms === 1 ? "room" : "rooms"}
        </p>
      </div>
    ),
  },
  {
    id: "sellAmount",
    accessorKey: "sellAmount",
    header: "Price",
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
        label={HOTEL_BOOKING_STATUS_LABELS[row.original.status]}
        tone={HOTEL_BOOKING_STATUS_TONES[row.original.status]}
      />
    ),
  },
];
