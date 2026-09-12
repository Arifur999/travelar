import { formatDate, formatDateTime } from "@/lib/format";

interface DateCellProps {
  date: unknown;
  withTime?: boolean;
  /** Shown when the column is nullable and this row has no value. */
  fallback?: string;
}

const DateCell = ({ date, withTime = false, fallback = "—" }: DateCellProps) => (
  <span className="whitespace-nowrap text-sm">
    {withTime ? formatDateTime(date, fallback) : formatDate(date, fallback)}
  </span>
);

export default DateCell;
