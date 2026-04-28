import type { AdminTransferInboxRow } from "@/types/adminTransferInbox";

export type TransferInboxSortKey = "student" | "from" | "to" | "by" | "note";

export function sortAdminTransferInboxRows(
  rows: AdminTransferInboxRow[],
  key: TransferInboxSortKey,
  dir: "asc" | "desc",
): AdminTransferInboxRow[] {
  const mult = dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const va =
      key === "student"
        ? a.studentLabel
        : key === "from"
          ? a.fromLabel
          : key === "to"
            ? a.toLabel
            : key === "by"
              ? a.byLabel
              : (a.note ?? "—");
    const vb =
      key === "student"
        ? b.studentLabel
        : key === "from"
          ? b.fromLabel
          : key === "to"
            ? b.toLabel
            : key === "by"
              ? b.byLabel
              : (b.note ?? "—");
    return va.localeCompare(vb, undefined, { sensitivity: "base" }) * mult;
  });
}
