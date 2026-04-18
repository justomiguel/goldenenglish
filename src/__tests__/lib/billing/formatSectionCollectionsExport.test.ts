import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import {
  buildSectionCollectionsCsv,
  buildSectionCollectionsCsvArtifact,
  buildSectionCollectionsXlsxArtifact,
  type SectionCollectionsExportLabels,
} from "@/lib/billing/formatSectionCollectionsExport";
import { buildSectionCollectionsView } from "@/lib/billing/buildSectionCollectionsView";
import type { SectionFeePlan } from "@/types/sectionFeePlan";

// REGRESSION CHECK: the CSV / XLSX shape is consumed by external accounting
// software. Changes to header order, separator, or marker codes need to be
// reflected here so the contract stays explicit.

const PLAN: SectionFeePlan = {
  id: "plan-1",
  sectionId: "sec-1",
  effectiveFromYear: 2026,
  effectiveFromMonth: 1,
  monthlyFee: 100,
  paymentsCount: 12,
  chargesEnrollmentFee: false,
  periodStartYear: 2026,
  periodStartMonth: 1,
  archivedAt: null,
};

const LABELS: SectionCollectionsExportLabels = {
  studentColumn: "Alumno",
  documentColumn: "Documento",
  expectedColumn: "Esperado",
  paidColumn: "Pagado",
  pendingColumn: "Pendiente",
  overdueColumn: "Vencido",
  totalsRowLabel: "TOTAL",
  monthShortLabels: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
  outOfPeriodMarker: "-",
  noPlanMarker: "—",
  paidMarker: "OK",
  pendingMarker: "REV",
  exemptMarker: "EX",
  rejectedMarker: "RX",
  upcomingMarker: "·",
  overdueMarker: "VENC",
};

function buildView() {
  return buildSectionCollectionsView({
    sectionId: "sec-1",
    sectionName: "Section A",
    cohortId: "cohort-1",
    cohortName: "2026",
    todayYear: 2026,
    todayMonth: 6,
    plans: [PLAN],
    students: [
      {
        studentId: "s1",
        studentName: "Ana Pérez",
        documentLabel: "DOC-1",
        scholarship: null,
        payments: [
          {
            id: "p1",
            sectionId: "sec-1",
            month: 1,
            year: 2026,
            amount: 100,
            status: "approved",
            receiptSignedUrl: null,
          },
        ],
      },
    ],
  });
}

describe("buildSectionCollectionsCsv", () => {
  it("starts with UTF-8 BOM and uses ; separator", () => {
    const csv = buildSectionCollectionsCsv(buildView(), LABELS);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    const headerLine = csv.slice(1).split("\r\n")[0];
    expect(headerLine.split(";")).toEqual([
      "Alumno",
      "Documento",
      ...LABELS.monthShortLabels,
      "Esperado",
      "Pagado",
      "Pendiente",
      "Vencido",
    ]);
  });

  it("uses comma decimals and escapes semicolons in names", () => {
    const view = buildView();
    view.students[0].studentName = "Pérez; Ana";
    const csv = buildSectionCollectionsCsv(view, LABELS);
    expect(csv).toContain('"Pérez; Ana"');
    expect(csv).toContain("100,00");
  });

  it("appends a totals row aligned with section kpis", () => {
    const csv = buildSectionCollectionsCsv(buildView(), LABELS);
    const lines = csv.replace(/^\uFEFF/, "").trimEnd().split("\r\n");
    const totals = lines[lines.length - 1].split(";");
    expect(totals[0]).toBe("TOTAL");
    expect(totals[totals.length - 4]).toBe("1200,00");
    expect(totals[totals.length - 3]).toBe("100,00");
  });
});

describe("buildSectionCollectionsCsvArtifact", () => {
  it("returns a CSV artifact with descriptive filename and base64 content", () => {
    const artifact = buildSectionCollectionsCsvArtifact(buildView(), LABELS);
    expect(artifact.filename).toBe("cobranza_Section_A_2026.csv");
    expect(artifact.mimeType).toBe("text/csv;charset=utf-8");
    const decoded = Buffer.from(artifact.base64, "base64").toString("utf-8");
    expect(decoded.charCodeAt(0)).toBe(0xfeff);
  });
});

describe("buildSectionCollectionsXlsxArtifact", () => {
  it("returns an XLSX artifact whose first row matches the CSV header", () => {
    const artifact = buildSectionCollectionsXlsxArtifact(buildView(), LABELS);
    expect(artifact.filename).toBe("cobranza_Section_A_2026.xlsx");
    expect(artifact.mimeType).toContain("spreadsheetml");
    const buf = Buffer.from(artifact.base64, "base64");
    const wb = XLSX.read(buf, { type: "buffer" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const aoa = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 });
    expect(aoa[0]).toEqual([
      "Alumno",
      "Documento",
      ...LABELS.monthShortLabels,
      "Esperado",
      "Pagado",
      "Pendiente",
      "Vencido",
    ]);
    const lastRow = aoa[aoa.length - 1];
    expect(lastRow[0]).toBe("TOTAL");
  });
});
