import { formatCurrency, toNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

interface MoneyCellProps {
  value: unknown;
  /**
   * Colour by sign: green above zero, red below. Off by default — a plain fare
   * is not "good news", so only use it where the sign carries meaning (profit,
   * a balance, a ledger movement).
   */
  signed?: boolean;
  /** Invert the colours, for a figure where a higher number is bad (a due). */
  invert?: boolean;
  className?: string;
}

/**
 * Right-aligned and tabular so a column of figures lines up on the decimal
 * point — the whole reason to have this rather than inlining formatCurrency.
 */
const MoneyCell = ({ value, signed = false, invert = false, className }: MoneyCellProps) => {
  const amount = toNumber(value);
  const isPositive = amount > 0;
  const isNegative = amount < 0;

  return (
    <span
      className={cn(
        "block text-right font-medium tabular-nums",
        signed && isPositive && (invert ? "text-destructive" : "text-success"),
        signed && isNegative && (invert ? "text-success" : "text-destructive"),
        className,
      )}
    >
      {formatCurrency(amount)}
    </span>
  );
};

export default MoneyCell;
