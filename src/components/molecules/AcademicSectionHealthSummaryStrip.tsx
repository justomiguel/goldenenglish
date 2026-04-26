import type { Dictionary } from "@/types/i18n";
import type { AdminSectionHealthSnapshot } from "@/types/adminSectionHealth";

export interface AcademicSectionHealthSummaryStripProps {
  locale: string;
  snapshot: AdminSectionHealthSnapshot;
  dict: Dictionary["dashboard"]["academicSectionPage"]["health"];
}

function fmtPct(locale: string, v: number | null, na: string) {
  if (v == null) return na;
  return new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 }).format(v / 100);
}

function fmtInt(locale: string, n: number) {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(n);
}

export function AcademicSectionHealthSummaryStrip({ locale, snapshot, dict }: AcademicSectionHealthSummaryStripProps) {
  const { na } = dict;
  const cap = fmtPct(locale, snapshot.capacityUtilizationPct, na);
  const att = fmtPct(locale, snapshot.attendance.ratePct, na);
  const students = fmtInt(locale, snapshot.activeStudents);
  const line = dict.summaryStrip.replace("{students}", students).replace("{capacity}", cap).replace("{attendance}", att);
  const sr = dict.summaryScreenReader.replace("{students}", students).replace("{capacity}", cap).replace("{attendance}", att);

  return (
    <p className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/15 px-3 py-2 text-sm text-[var(--color-muted-foreground)]">
      <span className="sr-only">{sr}</span>
      <span aria-hidden="true">{line}</span>
    </p>
  );
}
