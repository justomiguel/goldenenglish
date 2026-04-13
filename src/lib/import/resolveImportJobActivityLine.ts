import type { Dictionary } from "@/types/i18n";
import type { ImportJobActivityEntry } from "@/types/importJob";

type ImportJobLogLabels = Dictionary["admin"]["import"];

const MAX_META = 120;

function metaStr(meta: Record<string, string | number> | undefined, key: string): string {
  const v = meta?.[key];
  if (v === undefined || v === null) return "";
  const s = String(v);
  return s.length > MAX_META ? `${s.slice(0, MAX_META)}...` : s;
}

/**
 * Maps a job `activity[].code` (KV) to localized text for the progress popup.
 */
export function resolveImportJobActivityLine(
  code: string,
  meta: Record<string, string | number> | undefined,
  labels: ImportJobLogLabels,
): string {
  const total = metaStr(meta, "total");
  const current = metaStr(meta, "current");
  const err = metaStr(meta, "error");

  switch (code) {
    case "queued":
      return labels.jobLogQueued;
    case "rows_begin":
      return labels.jobLogRowsBegin.replace("{{total}}", total || "—");
    case "row_progress":
      return labels.jobLogRowProgress
        .replace("{{current}}", current || "0")
        .replace("{{total}}", total || "—");
    case "finalize":
      return labels.jobLogFinalize;
    case "completed":
      return labels.jobLogCompleted;
    case "cancelled_by_user":
      return labels.jobLogCancelledByUser;
    case "failed":
      return labels.jobLogFailed.replace("{{error}}", err || "—");
    default:
      return labels.jobLogUnknown.replace("{{code}}", code);
  }
}

export function formatImportJobActivityLog(
  entries: ImportJobActivityEntry[] | undefined,
  labels: ImportJobLogLabels,
): string[] {
  if (!entries?.length) return [];
  return entries.map((e) => resolveImportJobActivityLine(e.code, e.meta, labels));
}
