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
  | "profitWithdrawals"
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
  /** How many rows carry a figure in each money column. */
  rowsWith: Record<string, number>;
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
    profitWithdrawals: number;
  };
}

/** A problem, and the tab it was on. */
export interface ITabProblem extends IRowProblem {
  tab: string;
}

/**
 * How far a run has got.
 *
 * Named steps rather than a bare percentage: "Air tickets, 1,240 of 3,180" is
 * something to wait through, where a bar creeping along on its own only raises
 * the question of whether anything is happening at all.
 */
export interface IImportProgress {
  step: string;
  stepNumber: number;
  stepCount: number;
  done: number;
  total: number;
  /** 0–100, what the bar shows. */
  percent: number;
}

/** One upload, as the screen follows it and as the list remembers it. */
export interface IImportRun {
  id: string;
  filename: string;
  stage: "FOUNDATIONS" | "HISTORY" | "EVERYTHING";
  status: "RUNNING" | "COMPLETED" | "FAILED" | "REVERTED";
  counts: Record<string, number>;
  progress: IImportProgress | null;
  result: {
    totals?: Record<string, number>;
    skipped?: Record<string, number>;
    problems?: ITabProblem[];
  } | null;
  /** Why it failed, when it did. */
  note: string | null;
  revertedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** What starting a run answers with, before any of the work is done. */
export interface IImportStarted {
  importId: string;
  /** Set when this exact file is already in, and was not undone. */
  alreadyImported: IImportRun | null;
}
