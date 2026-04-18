import * as XLSX from "xlsx";
import type {
  SectionCollectionsStudentRow,
  SectionCollectionsView,
} from "@/types/sectionCollections";

const MONTH_INDICES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

export interface SectionCollectionsExportLabels {
  studentColumn: string;
  documentColumn: string;
  expectedColumn: string;
  paidColumn: string;
  pendingColumn: string;
  overdueColumn: string;
  totalsRowLabel: string;
  monthShortLabels: readonly string[];
  /** Marker text written in a cell when the month is out of plan period. */
  outOfPeriodMarker: string;
  /** Marker text written when the cell has no plan at all. */
  noPlanMarker: string;
  /** Marker text written for a paid (approved) cell. */
  paidMarker: string;
  /** Marker text written for a pending review cell. */
  pendingMarker: string;
  /** Marker text written for an exempt cell. */
  exemptMarker: string;
  /** Marker text written for a rejected cell. */
  rejectedMarker: string;
  /** Marker text written for an upcoming due cell. */
  upcomingMarker: string;
  /** Marker text written for an overdue cell. */
  overdueMarker: string;
}

export interface SectionCollectionsExportArtifact {
  filename: string;
  mimeType: string;
  /** Already base64-encoded payload, ready to ship to the client. */
  base64: string;
}

interface BuiltRow {
  student: string;
  document: string;
  monthCells: string[];
  expected: number;
  paid: number;
  pending: number;
  overdue: number;
}

function safeFilename(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80) || "section";
}

function statusMarker(
  cell: SectionCollectionsStudentRow["row"]["cells"][number],
  todayIdx: number,
  labels: SectionCollectionsExportLabels,
): string {
  switch (cell.status) {
    case "approved":
      return labels.paidMarker;
    case "pending":
      return labels.pendingMarker;
    case "rejected":
      return labels.rejectedMarker;
    case "exempt":
      return labels.exemptMarker;
    case "out-of-period":
      return labels.outOfPeriodMarker;
    case "no-plan":
      return labels.noPlanMarker;
    case "due": {
      const idx = cell.year * 12 + cell.month;
      return idx < todayIdx ? labels.overdueMarker : labels.upcomingMarker;
    }
    default:
      return "";
  }
}

function buildRows(
  view: SectionCollectionsView,
  labels: SectionCollectionsExportLabels,
): BuiltRow[] {
  const todayIdx = view.year * 12 + view.todayMonth;
  return view.students.map((s) => ({
    student: s.studentName,
    document: s.documentLabel ?? "",
    monthCells: MONTH_INDICES.map((m) => {
      const cell = s.row.cells.find((c) => c.month === m);
      if (!cell) return labels.noPlanMarker;
      return statusMarker(cell, todayIdx, labels);
    }),
    expected: s.expectedYear,
    paid: s.paid,
    pending: s.pendingReview,
    overdue: s.overdue,
  }));
}

function csvEscape(value: string): string {
  if (/[";\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function formatCsvNumber(n: number): string {
  return n.toFixed(2).replace(".", ",");
}

/**
 * Build an Excel-friendly CSV (UTF-8 BOM, ; separator, comma decimals).
 * Pure: returns the raw CSV string. Caller wraps it as artifact when needed.
 */
export function buildSectionCollectionsCsv(
  view: SectionCollectionsView,
  labels: SectionCollectionsExportLabels,
): string {
  const rows = buildRows(view, labels);
  const header = [
    labels.studentColumn,
    labels.documentColumn,
    ...labels.monthShortLabels,
    labels.expectedColumn,
    labels.paidColumn,
    labels.pendingColumn,
    labels.overdueColumn,
  ];
  const body = rows.map((r) => [
    r.student,
    r.document,
    ...r.monthCells,
    formatCsvNumber(r.expected),
    formatCsvNumber(r.paid),
    formatCsvNumber(r.pending),
    formatCsvNumber(r.overdue),
  ]);
  const totals = [
    labels.totalsRowLabel,
    "",
    ...MONTH_INDICES.map(() => ""),
    formatCsvNumber(view.kpis.expectedYear),
    formatCsvNumber(view.kpis.paid),
    formatCsvNumber(view.kpis.pendingReview),
    formatCsvNumber(view.kpis.overdue),
  ];
  const allRows = [header, ...body, totals];
  const csv = allRows
    .map((r) => r.map(csvEscape).join(";"))
    .join("\r\n");
  return `\uFEFF${csv}\r\n`;
}

function toBase64(value: string | Uint8Array): string {
  if (typeof value === "string") {
    return Buffer.from(value, "utf-8").toString("base64");
  }
  return Buffer.from(value).toString("base64");
}

export function buildSectionCollectionsCsvArtifact(
  view: SectionCollectionsView,
  labels: SectionCollectionsExportLabels,
): SectionCollectionsExportArtifact {
  const csv = buildSectionCollectionsCsv(view, labels);
  return {
    filename: `cobranza_${safeFilename(view.sectionName)}_${view.year}.csv`,
    mimeType: "text/csv;charset=utf-8",
    base64: toBase64(csv),
  };
}

/**
 * Build an XLSX workbook in the same shape as the CSV. Uses the existing
 * `xlsx` dependency (already in package.json) — no new dependency.
 */
export function buildSectionCollectionsXlsxArtifact(
  view: SectionCollectionsView,
  labels: SectionCollectionsExportLabels,
): SectionCollectionsExportArtifact {
  const rows = buildRows(view, labels);
  const header = [
    labels.studentColumn,
    labels.documentColumn,
    ...labels.monthShortLabels,
    labels.expectedColumn,
    labels.paidColumn,
    labels.pendingColumn,
    labels.overdueColumn,
  ];
  const body = rows.map((r) => [
    r.student,
    r.document,
    ...r.monthCells,
    r.expected,
    r.paid,
    r.pending,
    r.overdue,
  ]);
  const totals = [
    labels.totalsRowLabel,
    "",
    ...MONTH_INDICES.map(() => ""),
    view.kpis.expectedYear,
    view.kpis.paid,
    view.kpis.pendingReview,
    view.kpis.overdue,
  ];
  const ws = XLSX.utils.aoa_to_sheet([header, ...body, totals]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Cobranza");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  return {
    filename: `cobranza_${safeFilename(view.sectionName)}_${view.year}.xlsx`,
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    base64: toBase64(buf),
  };
}
