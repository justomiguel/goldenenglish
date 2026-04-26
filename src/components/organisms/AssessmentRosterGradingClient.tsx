"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { ClipboardCheck } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import type { AssessmentMatrixRosterRow } from "@/types/assessmentGrades";
import type { RubricDimensionDef } from "@/types/rubricDimensions";
import { useAppSurface } from "@/hooks/useAppSurface";
import { Button } from "@/components/atoms/Button";
import { AssessmentGradingShell } from "@/components/molecules/AssessmentGradingShell";
import { AssessmentGradingEditor } from "@/components/molecules/AssessmentGradingEditor";

export interface AssessmentRosterGradingClientProps {
  locale: string;
  sectionId: string;
  assessmentId: string;
  assessmentName: string;
  assessmentDateLabel: string;
  maxScore: number;
  dimensions: RubricDimensionDef[];
  rows: AssessmentMatrixRosterRow[];
  dict: Dictionary["dashboard"]["teacherAssessmentMatrix"];
}

export function AssessmentRosterGradingClient({
  locale,
  sectionId,
  assessmentId,
  assessmentName,
  assessmentDateLabel,
  maxScore,
  dimensions,
  rows,
  dict,
}: AssessmentRosterGradingClientProps) {
  const surface = useAppSurface();
  const narrow = surface === "web-mobile" || surface === "pwa-mobile";
  const titleId = useId();
  const [openId, setOpenId] = useState<string | null>(null);
  const [statusByEnr, setStatusByEnr] = useState<Record<string, "draft" | "published">>({});
  const [saveBanner, setSaveBanner] = useState<string | null>(null);

  useEffect(() => {
    if (!saveBanner) return;
    const t = window.setTimeout(() => setSaveBanner(null), 4500);
    return () => window.clearTimeout(t);
  }, [saveBanner]);

  const serverRowFingerprint = (enrollmentId: string) => {
    const r = rows.find((x) => x.enrollmentId === enrollmentId);
    if (!r) return enrollmentId;
    return `${r.score ?? ""}-${r.gradeStatus ?? ""}-${JSON.stringify(r.rubric)}-${(r.teacherFeedback ?? "").slice(0, 160)}`;
  };

  const merged = useMemo(
    () =>
      rows.map((r) => ({
        ...r,
        gradeStatus: statusByEnr[r.enrollmentId] ?? r.gradeStatus,
      })),
    [rows, statusByEnr],
  );

  const active = openId ? merged.find((r) => r.enrollmentId === openId) : null;

  const lead = dict.assessmentLead
    .replace("{name}", assessmentName)
    .replace("{maxScore}", String(maxScore))
    .replace("{date}", assessmentDateLabel);

  function statusDot(row: (typeof merged)[0]) {
    const st = row.gradeStatus;
    if (st === "published") {
      return (
        <span
          className="inline-block size-3 rounded-full bg-[var(--color-success)]"
          title={dict.statusPublished}
          aria-label={dict.statusDotPublishedAria}
        />
      );
    }
    if (st === "draft") {
      return (
        <span
          className="inline-block size-3 rounded-full bg-[var(--color-warning)]"
          title={dict.statusDraft}
          aria-label={dict.statusDotDraftAria}
        />
      );
    }
    return (
      <span
        className="inline-block size-3 rounded-full bg-[var(--color-muted-foreground)]/40"
        title={dict.statusPending}
        aria-label={dict.statusDotPendingAria}
      />
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--color-muted-foreground)]">{lead}</p>
      <p className="text-xs text-[var(--color-muted-foreground)]">{dict.legend}</p>
      {saveBanner ? (
        <p className="text-sm text-[var(--color-success)]" role="status">
          {saveBanner}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-[var(--layout-border-radius)] border border-[var(--color-border)]">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[var(--color-muted)]/40">
            <tr>
              <th className="px-3 py-2 font-medium text-[var(--color-foreground)]">{dict.studentColumn}</th>
              <th className="px-3 py-2 font-medium text-[var(--color-foreground)]">{dict.statusColumn}</th>
              <th className="px-3 py-2 font-medium text-[var(--color-foreground)]" />
            </tr>
          </thead>
          <tbody>
            {merged.map((row) => (
              <tr key={row.enrollmentId} className="border-t border-[var(--color-border)]">
                <td className="px-3 py-2 text-[var(--color-foreground)]">{row.studentLabel}</td>
                <td className="px-3 py-2">{statusDot(row)}</td>
                <td className="px-3 py-2 text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    className="min-h-[44px]"
                    aria-label={dict.evaluateAria.replace("{student}", row.studentLabel)}
                    onClick={() => setOpenId(row.enrollmentId)}
                  >
                    <ClipboardCheck className="h-4 w-4 shrink-0" aria-hidden />
                    {dict.evaluate}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AssessmentGradingShell
        narrow={narrow}
        open={openId != null}
        onOpenChange={(o) => {
          if (!o) setOpenId(null);
        }}
        titleId={titleId}
        title={assessmentName}
        backdropCloseAria={dict.backdropCloseAria}
      >
        {active ? (
          <div>
            <p className="mb-3 text-sm text-[var(--color-muted-foreground)]">{dict.rosterTitle}</p>
            <AssessmentGradingEditor
              key={`${active.enrollmentId}-${serverRowFingerprint(active.enrollmentId)}`}
              locale={locale}
              sectionId={sectionId}
              assessmentId={assessmentId}
              maxScore={maxScore}
              dimensions={dimensions}
              row={active}
              dict={dict}
              onClose={() => setOpenId(null)}
              onSaved={(enrollmentId, status) => {
                setStatusByEnr((m) => ({ ...m, [enrollmentId]: status }));
                setSaveBanner(status === "published" ? dict.savedPublishedOk : dict.savedDraftOk);
              }}
            />
          </div>
        ) : null}
      </AssessmentGradingShell>
    </div>
  );
}
