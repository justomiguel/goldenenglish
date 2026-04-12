import type { BulkImportResult } from "@/lib/import/bulkImportStudents";

export type ImportJobStatus = "queued" | "running" | "done" | "error";

/** Append-only entry the backend writes for the activity popup (codes + i18n-friendly meta). */
export type ImportJobActivityEntry = {
  t: number;
  code: string;
  meta?: Record<string, string | number>;
};

export type ImportJobState = {
  status: ImportJobStatus;
  ownerId: string;
  phase: string;
  message: string;
  /** Rows completed so far (0…total). */
  current: number;
  total: number;
  /** 1-based row index currently being processed (set at the start of each row). */
  activeRow?: number;
  updatedAt: number;
  /** Activity log shown in the client (localized by `code`). */
  activity?: ImportJobActivityEntry[];
  result?: BulkImportResult;
  error?: string;
};

/** Patch payload for KV: same fields as `ImportJobState` plus optional activity append. */
export type MergeImportJobPatch = Partial<ImportJobState> & {
  activityAppend?: ImportJobActivityEntry;
};
