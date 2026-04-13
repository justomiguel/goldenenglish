"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/types/i18n";
import { useAppSurface } from "@/hooks/useAppSurface";
import { TeacherSuggestionShell } from "@/components/molecules/TeacherSuggestionShell";
import { TeacherTransferSuggestionForm } from "@/components/molecules/TeacherTransferSuggestionForm";
import { TeacherStudentQuickContext } from "@/components/molecules/TeacherStudentQuickContext";
import { TeacherRosterStudentRow } from "@/components/molecules/TeacherRosterStudentRow";
import type { TeacherAttendancePreviewRow, TeacherRosterRow, TeacherTransferTargetOption } from "@/types/teacherPortal";

export type { TeacherRosterRow } from "@/types/teacherPortal";

type TabKey = "active" | "dropped" | "transferred";

function rowInTab(tab: TabKey, status: string) {
  if (tab === "active") return status === "active" || status === "completed";
  if (tab === "dropped") return status === "dropped";
  return status === "transferred";
}

export interface TeacherSectionRosterProps {
  locale: string;
  sectionId: string;
  rows: TeacherRosterRow[];
  sectionTargetsFull: TeacherTransferTargetOption[];
  cohortTargetsFull: TeacherTransferTargetOption[];
  pendingStudentIds: string[];
  attendanceByStudent: Record<string, TeacherAttendancePreviewRow[]>;
  dict: Dictionary["dashboard"]["teacherMySections"];
}

export function TeacherSectionRoster({
  locale,
  sectionId,
  rows,
  sectionTargetsFull,
  cohortTargetsFull,
  pendingStudentIds,
  attendanceByStudent,
  dict,
}: TeacherSectionRosterProps) {
  const router = useRouter();
  const surface = useAppSurface();
  const narrow = surface === "web-mobile" || surface === "pwa-mobile";
  const [tab, setTab] = useState<TabKey>("active");
  const [suggestion, setSuggestion] = useState<{
    kind: "section" | "cohort";
    studentId: string;
    studentLabel: string;
  } | null>(null);
  const [context, setContext] = useState<{ studentId: string; label: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [formNonce, setFormNonce] = useState(0);

  const pendingSet = useMemo(() => new Set(pendingStudentIds), [pendingStudentIds]);

  const filtered = useMemo(() => rows.filter((r) => rowInTab(tab, r.status)), [rows, tab]);

  const targetsForSuggestion = useMemo(() => {
    if (!suggestion) return [];
    return suggestion.kind === "section" ? sectionTargetsFull : cohortTargetsFull;
  }, [suggestion, sectionTargetsFull, cohortTargetsFull]);

  const onTransferSuccess = useCallback(() => {
    setToast(dict.suggestionSentToast);
    setSuggestion(null);
    router.refresh();
  }, [dict.suggestionSentToast, router]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(t);
  }, [toast]);

  return (
    <div className="space-y-4">
      {toast ? (
        <div
          role="status"
          className="fixed bottom-4 left-1/2 z-[200] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-foreground)] shadow-[var(--shadow-card)]"
          style={{ marginBottom: "max(0px, env(safe-area-inset-bottom))" }}
        >
          {toast}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2 border-b border-[var(--color-border)] pb-3">
        {(["active", "dropped", "transferred"] as const).map((k) => (
          <button
            key={k}
            type="button"
            className={`min-h-[44px] rounded-full px-3 py-1.5 text-sm font-medium ${
              tab === k
                ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                : "bg-[var(--color-muted)] text-[var(--color-foreground)]"
            }`}
            onClick={() => setTab(k)}
          >
            {dict.tabs[k]}
          </button>
        ))}
      </div>

      <ul className="divide-y divide-[var(--color-border)] rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        {filtered.length === 0 ? (
          <li className="px-4 py-4 text-sm text-[var(--color-muted-foreground)]">{dict.emptyTab}</li>
        ) : (
          filtered.map((r) => (
            <TeacherRosterStudentRow
              key={r.enrollmentId}
              label={r.label}
              avatarDisplayUrl={r.avatarDisplayUrl}
              statusLabel={r.status}
              showActions={tab === "active"}
              hasPendingTransfer={pendingSet.has(r.studentId)}
              narrow={narrow}
              dict={dict}
              onOpenContext={() => setContext({ studentId: r.studentId, label: r.label })}
              onSuggestSection={() => {
                setFormNonce((n) => n + 1);
                setSuggestion({ kind: "section", studentId: r.studentId, studentLabel: r.label });
              }}
              onSuggestCohort={() => {
                setFormNonce((n) => n + 1);
                setSuggestion({ kind: "cohort", studentId: r.studentId, studentLabel: r.label });
              }}
            />
          ))
        )}
      </ul>

      <TeacherSuggestionShell
        open={suggestion !== null}
        onOpenChange={(v) => {
          if (!v) setSuggestion(null);
        }}
        titleId="teacher-suggestion-title"
        title={
          suggestion
            ? `${suggestion.kind === "section" ? dict.suggestSection : dict.suggestCohort} — ${suggestion.studentLabel}`
            : dict.transferModalTitle
        }
      >
        {suggestion ? (
          <TeacherTransferSuggestionForm
            locale={locale}
            formInstanceKey={`${suggestion.studentId}-${suggestion.kind}-${formNonce}`}
            studentId={suggestion.studentId}
            fromSectionId={sectionId}
            kind={suggestion.kind}
            targets={targetsForSuggestion}
            dict={dict}
            onCancel={() => setSuggestion(null)}
            onSuccess={onTransferSuccess}
          />
        ) : null}
      </TeacherSuggestionShell>

      <TeacherStudentQuickContext
        open={context !== null}
        onOpenChange={(v) => {
          if (!v) setContext(null);
        }}
        titleId="teacher-student-context-title"
        studentLabel={context ? `${dict.quickContextTitle}: ${context.label}` : ""}
        dict={dict}
        attendanceRows={context ? (attendanceByStudent[context.studentId] ?? []) : []}
      />
    </div>
  );
}
