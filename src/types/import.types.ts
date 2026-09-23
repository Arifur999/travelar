/**
 * Reading an agency's old spreadsheet.
 *
 * Mirrors the API's preview response. Nothing here writes: the preview says
 * what a file holds and what it would create, and a person decides.
 */

export type ImportKind =
  | "sales"
  | "collections"
  | "supplierPayments"
  | "expenses"
  | "masterData"
  | "capital"
  | "accounts";

export interface IRowProblem {
  /** 1-based, as the spreadsheet shows it. */
  row: number;
  field: string;
  message: string;
}

export interface ITabPreview {
  tab: string;
  kind: ImportKind | null;
  title: string | null;
  /** What each row would become, in words. */
  creates: string | null;
  dataRows: number;
  readyRows: number;
  /** Our field → the column heading it was found under. */
  mapped: Record<string, string>;
  unmapped: string[];
  problems: IRowProblem[];
  sample: Record<string, string | number | null>[];
  totals: Record<string, number>;
}

export interface IImportPreview {
  filename: string;
  tabs: ITabPreview[];
  /** Report tabs, skipped on purpose — this app computes those itself. */
  skipped: string[];
  wouldCreate: {
    customers: number;
    suppliers: number;
    airlines: number;
    accounts: number;
    expenseCategories: number;
    tickets: number;
    ticketPayments: number;
    collections: number;
    supplierPayments: number;
    expenses: number;
    capitalFlows: number;
  };
}
