import type { Dictionary } from "@/types/i18n";
import type { ParentRecentAttendanceModel } from "@/lib/parent/loadParentRecentAttendance";
import { ParentAttendancePwaSectionCard } from "@/components/pwa/molecules/ParentAttendancePwaSectionCard";

type ParentAttendanceLabels = Dictionary["dashboard"]["parent"]["attendancePwa"];

export interface ParentAttendanceHistoryProps {
  locale: string;
  model: ParentRecentAttendanceModel;
  labels: ParentAttendanceLabels;
  selectedStudentId: string | null;
  selectedSectionId?: string | null;
  /** Caps the marks shown per section; the detail route shows them all. */
  maxMarksPerSection?: number;
}

export function ParentAttendanceHistory({
  locale,
  model,
  labels,
  selectedStudentId,
  selectedSectionId = null,
  maxMarksPerSection,
}: ParentAttendanceHistoryProps) {
  const summaries = model.sectionSummaries.filter((summary) => {
    if (selectedStudentId && summary.studentId !== selectedStudentId) return false;
    if (selectedSectionId && summary.sectionId !== selectedSectionId) return false;
    return true;
  });

  const marksBySection = new Map<string, ParentRecentAttendanceModel["marks"]>();
  for (const mark of model.marks) {
    if (selectedStudentId && mark.studentId !== selectedStudentId) continue;
    if (selectedSectionId && mark.sectionId !== selectedSectionId) continue;
    const key = `${mark.studentId}:${mark.sectionId}`;
    const list = marksBySection.get(key) ?? [];
    list.push(mark);
    marksBySection.set(key, list);
  }
  for (const [key, list] of marksBySection) {
    list.sort((a, b) => b.attendedOn.localeCompare(a.attendedOn));
    marksBySection.set(key, maxMarksPerSection ? list.slice(0, maxMarksPerSection) : list);
  }

  if (summaries.length === 0) {
    return (
      <p className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-6 text-center text-sm text-[var(--color-muted-foreground)]">
        {labels.empty}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {summaries.map((summary) => {
        const key = `${summary.studentId}:${summary.sectionId}`;
        return (
          <ParentAttendancePwaSectionCard
            key={key}
            summary={summary}
            marks={marksBySection.get(key) ?? []}
            locale={locale}
            labels={labels}
            showChildLabel={false}
          />
        );
      })}
    </div>
  );
}
