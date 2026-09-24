import { POSTING_SOURCE_LABELS, type PostingSource } from "@/types/enums.types";
import { type IAccountOverviewRow } from "@/types/account.types";

/**
 * Shapes the balance dashboard into what its chart draws.
 *
 * Kept free of React because the sparse `bySource` map is easy to read wrong:
 * a source absent from an account is not a zero to be skipped on that account
 * alone, it is a zero to be added to that source's total.
 */

export interface SourceBar {
  key: PostingSource;
  label: string;
  /** Signed: money in above the axis, money out below it. */
  value: number;
  isNegative: boolean;
}

/**
 * Every posting source that moved money, summed across all the accounts, in
 * the order the dashboard's columns already use.
 *
 * A source that nets to exactly zero is left out: a bar of no height with a
 * label under it says nothing the reader can act on, and there are thirteen
 * sources competing for the width.
 */
export const buildSourceFlow = (
  rows: IAccountOverviewRow[],
  order: PostingSource[],
): SourceBar[] =>
  order
    .map((source) => {
      const value = rows.reduce((sum, row) => sum + (row.bySource[source] ?? 0), 0);
      return {
        key: source,
        label: POSTING_SOURCE_LABELS[source],
        value,
        isNegative: value < 0,
      };
    })
    .filter((bar) => bar.value !== 0);

/** True when nothing has moved through any account yet. */
export const isSourceFlowEmpty = (bars: SourceBar[]): boolean => bars.length === 0;
