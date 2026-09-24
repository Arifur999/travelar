import DateCell from "@/components/shared/cell/DateCell";
import MoneyCell from "@/components/shared/cell/MoneyCell";
import PersonCell from "@/components/shared/cell/PersonCell";
import StatusBadge from "@/components/shared/cell/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { formatNumber, toNumber, truncate } from "@/lib/format";
import { type AppColumnDef } from "@/lib/table/features";
import {
  ATTENDANCE_STATUS_LABELS,
  EMPLOYEE_PAYOUT_TYPE_LABELS,
} from "@/types/enums.types";
import {
  type IEmployee,
  type IEmployeeAttendance,
  type IEmployeeTransaction,
} from "@/types/employee.types";

export const employeesColumns: AppColumnDef<IEmployee>[] = [
  {
    id: "name",
    accessorKey: "name",
    header: "Employee",
    cell: ({ row }) => (
      <PersonCell name={row.original.name} secondary={row.original.phone} />
    ),
  },
  {
    id: "joinDate",
    accessorKey: "joinDate",
    header: "Joined",
    cell: ({ row }) => <DateCell date={row.original.joinDate} />,
  },
  {
    id: "tenure",
    header: "Tenure",
    // Computed from the dates in the service, so there is no column to sort on.
    enableSorting: false,
    cell: ({ row }) => {
      const { workingMonths, workingDays } = row.original;
      return (
        <span className="text-sm whitespace-nowrap">
          {workingMonths > 0 && `${formatNumber(workingMonths)}m `}
          {formatNumber(workingDays)}d
        </span>
      );
    },
  },
  {
    id: "totalSalary",
    header: "Salary paid",
    enableSorting: false,
    cell: ({ row }) => <MoneyCell value={row.original.totalSalary} />,
  },
  {
    id: "totalBonus",
    header: "Bonus paid",
    enableSorting: false,
    cell: ({ row }) => (
      <MoneyCell value={row.original.totalBonus} className="text-muted-foreground" />
    ),
  },
  {
    id: "isActive",
    header: "Status",
    enableSorting: false,
    cell: ({ row }) =>
      // Derived from the presence of a resign date — there is no stored flag.
      row.original.isActive ? (
        <StatusBadge label="Active" tone="success" />
      ) : (
        <StatusBadge label="Resigned" tone="neutral" />
      ),
  },
];

export const payoutColumns: AppColumnDef<IEmployeeTransaction>[] = [
  {
    id: "date",
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => <DateCell date={row.original.date} />,
  },
  {
    id: "employee.name",
    header: "Employee",
    enableSorting: false,
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{row.original.employee.name}</p>
        <p className="truncate text-xs text-muted-foreground">{row.original.employee.phone}</p>
      </div>
    ),
  },
  {
    id: "type",
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => (
      <StatusBadge
        label={EMPLOYEE_PAYOUT_TYPE_LABELS[row.original.type]}
        tone={row.original.type === "SALARY" ? "info" : "success"}
      />
    ),
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
    cell: ({ row }) => (
      <div>
        <MoneyCell value={row.original.amount} />
        {/* Only meaningful on a salary payment. */}
        {row.original.type === "SALARY" && row.original.totalDays ? (
          <p className="text-right text-xs text-muted-foreground">
            {formatNumber(row.original.totalDays)} days
          </p>
        ) : null}
      </div>
    ),
  },
  {
    id: "note",
    accessorKey: "note",
    header: "Note",
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.note ? truncate(row.original.note, 40) : "—"}
      </span>
    ),
  },
];

export const attendanceColumns: AppColumnDef<IEmployeeAttendance>[] = [
  {
    id: "date",
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => <DateCell date={row.original.date} />,
  },
  {
    id: "employee.name",
    header: "Employee",
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-sm font-medium">{row.original.employee.name}</span>
    ),
  },
  {
    id: "status",
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <StatusBadge
        label={ATTENDANCE_STATUS_LABELS[row.original.status]}
        tone={row.original.status === "PRESENT" ? "success" : "danger"}
      />
    ),
  },
  {
    id: "hours",
    header: "Hours",
    enableSorting: false,
    cell: ({ row }) => {
      const hours = toNumber(row.original.totalHours);
      const { startTime, endTime } = row.original;

      return (
        <div className="text-sm">
          <p className="tabular-nums">{hours.toFixed(2)}h</p>
          {startTime && (
            <p className="text-xs text-muted-foreground">
              {startTime}
              {endTime ? ` – ${endTime}` : ""}
            </p>
          )}
        </div>
      );
    },
  },
];
