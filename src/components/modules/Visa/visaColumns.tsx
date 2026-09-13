import DateCell from "@/components/shared/cell/DateCell";
import MoneyCell from "@/components/shared/cell/MoneyCell";
import StatusBadge from "@/components/shared/cell/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { type AppColumnDef } from "@/lib/table/features";
import { VISA_STATUS_LABELS, VISA_STATUS_TONES } from "@/types/enums.types";
import { type IVisaAgent, type IVisaCase } from "@/types/visa.types";

export const visaCasesColumns: AppColumnDef<IVisaCase>[] = [
  {
    id: "customer.name",
    header: "Applicant",
    // A relation field; QueryBuilder builds a flat orderBy.
    enableSorting: false,
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{row.original.customer.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {row.original.customer.passportNo || row.original.customer.phone}
        </p>
      </div>
    ),
  },
  {
    id: "country",
    accessorKey: "country",
    header: "Destination",
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="text-sm font-medium">{row.original.country}</p>
        <p className="text-xs text-muted-foreground">{row.original.visaType}</p>
      </div>
    ),
  },
  {
    id: "applicationNo",
    accessorKey: "applicationNo",
    header: "Application",
    cell: ({ row }) => (
      <span className="font-mono text-sm whitespace-nowrap">
        {row.original.applicationNo || "—"}
      </span>
    ),
  },
  {
    id: "documents",
    header: "Docs",
    enableSorting: false,
    cell: ({ row }) => {
      const { received, total } = row.original.documentsProgress;
      if (total === 0) return <span className="text-muted-foreground">—</span>;

      const complete = received === total;
      return (
        <Badge variant="outline" className={complete ? "border-success/30 text-success" : ""}>
          {received}/{total}
        </Badge>
      );
    },
  },
  {
    id: "totalFee",
    header: "Fee",
    // serviceFee + embassyFee, derived in the service — no SQL column for it.
    enableSorting: false,
    cell: ({ row }) => <MoneyCell value={row.original.totalFee} />,
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
        label={VISA_STATUS_LABELS[row.original.status]}
        tone={VISA_STATUS_TONES[row.original.status]}
      />
    ),
  },
  {
    id: "submittedAt",
    accessorKey: "submittedAt",
    header: "Submitted",
    cell: ({ row }) => <DateCell date={row.original.submittedAt} />,
  },
];

export const visaAgentsColumns: AppColumnDef<IVisaAgent>[] = [
  {
    id: "name",
    accessorKey: "name",
    header: "Agent",
    cell: ({ row }) => <span className="text-sm font-medium">{row.original.name}</span>,
  },
  {
    id: "type",
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) =>
      row.original.type ? (
        <Badge variant="outline">{row.original.type}</Badge>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    id: "contact",
    accessorKey: "contact",
    header: "Contact",
    enableSorting: false,
    cell: ({ row }) => (
      <div className="min-w-0 text-sm">
        <p className="truncate">{row.original.contact || "—"}</p>
        {row.original.email && (
          <p className="truncate text-xs text-muted-foreground">{row.original.email}</p>
        )}
      </div>
    ),
  },
];
