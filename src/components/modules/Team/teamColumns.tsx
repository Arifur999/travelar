import DateCell from "@/components/shared/cell/DateCell";
import PersonCell from "@/components/shared/cell/PersonCell";
import StatusBadge from "@/components/shared/cell/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { type AppColumnDef } from "@/lib/table/features";
import { USER_ROLE_LABELS, USER_STATUS_LABELS, USER_STATUS_TONES } from "@/types/enums.types";
import { type ITeamMember } from "@/types/team.types";

/** A factory rather than a constant: the "You" marker depends on who is looking. */
export const buildTeamColumns = (viewerId: string): AppColumnDef<ITeamMember>[] => [
  {
    id: "name",
    accessorKey: "name",
    header: "Member",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <PersonCell name={row.original.name} secondary={row.original.email} />
        {row.original.id === viewerId && (
          <Badge variant="outline" className="text-xs">
            You
          </Badge>
        )}
      </div>
    ),
  },
  {
    id: "role",
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => (
      <div className="flex flex-wrap items-center gap-1">
        <Badge variant={row.original.role === "AGENCY_ADMIN" ? "default" : "secondary"}>
          {USER_ROLE_LABELS[row.original.role]}
        </Badge>
        {row.original.isOwner && <StatusBadge label="Owner" tone="info" />}
      </div>
    ),
  },
  {
    id: "status",
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <div className="flex flex-wrap items-center gap-1">
        <StatusBadge
          label={USER_STATUS_LABELS[row.original.status]}
          tone={USER_STATUS_TONES[row.original.status]}
        />
        {/* Still on the password an admin set — they have not signed in and
            replaced it yet. */}
        {row.original.needPasswordChange && row.original.status === "ACTIVE" && (
          <StatusBadge label="Awaiting first login" tone="warning" />
        )}
      </div>
    ),
  },
  {
    id: "createdAt",
    accessorKey: "createdAt",
    header: "Added",
    cell: ({ row }) => <DateCell date={row.original.createdAt} />,
  },
];
