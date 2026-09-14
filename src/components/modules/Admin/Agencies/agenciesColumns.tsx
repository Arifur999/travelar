import DateCell from "@/components/shared/cell/DateCell";
import StatusBadge from "@/components/shared/cell/StatusBadge";
import { daysUntil } from "@/lib/format";
import { type AppColumnDef } from "@/lib/table/features";
import { type IAdminAgency } from "@/types/admin.types";
import { AGENCY_STATUS_LABELS, AGENCY_STATUS_TONES } from "@/types/enums.types";

export const agenciesColumns: AppColumnDef<IAdminAgency>[] = [
  {
    id: "name",
    accessorKey: "name",
    header: "Agency",
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{row.original.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {row.original.email || row.original.phone || "—"}
        </p>
      </div>
    ),
  },
  {
    id: "status",
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <StatusBadge
        label={AGENCY_STATUS_LABELS[row.original.status]}
        tone={AGENCY_STATUS_TONES[row.original.status]}
      />
    ),
  },
  {
    id: "plan.name",
    header: "Plan",
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-sm">{row.original.plan?.name ?? "—"}</span>
    ),
  },
  {
    id: "ends",
    header: "Ends",
    enableSorting: false,
    cell: ({ row }) => {
      const { status, trialEndsAt, subscriptionEndsAt } = row.original;
      const end = status === "TRIAL" ? trialEndsAt : subscriptionEndsAt;
      if (!end) return <span className="text-muted-foreground">—</span>;

      const days = daysUntil(end);
      // Within a week is when an operator can still do something about it.
      const soon = days !== null && days <= 7;

      return (
        <div>
          <DateCell date={end} />
          <p className={soon ? "text-xs text-warning" : "text-xs text-muted-foreground"}>
            {days === 0 ? "ended" : `${days} day${days === 1 ? "" : "s"} left`}
            {status === "TRIAL" ? " of trial" : ""}
          </p>
        </div>
      );
    },
  },
  {
    id: "createdAt",
    accessorKey: "createdAt",
    header: "Joined",
    cell: ({ row }) => <DateCell date={row.original.createdAt} />,
  },
];
