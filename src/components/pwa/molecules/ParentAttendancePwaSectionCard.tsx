"use client";

import { useId, useState } from "react";
import { ChevronDown, UserRound } from "lucide-react";
import type { ParentAttendanceSectionSummary } from "@/lib/parent/buildParentAttendanceSectionSummaries";
import type { ParentAttendanceMark } from "@/lib/parent/loadParentRecentAttendance";
import type { Dictionary } from "@/types/i18n";
import { ParentAttendancePwaMarkRow } from "@/components/pwa/molecules/ParentAttendancePwaMarkRow";
import {
  formatSectionMonthLine,
  parentAttendancePwaLabel,
  recentMarksToggleAria,
} from "@/lib/parent/parentAttendancePwaLabelHelpers";

type Labels = Dictionary["dashboard"]["parent"]["attendancePwa"];

export interface ParentAttendancePwaSectionCardProps {
  summary: ParentAttendanceSectionSummary;
  marks: ParentAttendanceMark[];
  locale: string;
  labels: Labels;
  /** When several linked students and no global child filter is active. */
  showChildLabel: boolean;
}

function levelClasses(level: ParentAttendanceSectionSummary["level"]): string {
  if (level === "ok") return "text-[var(--color-success)]";
  if (level === "attention") return "text-[var(--color-error)]";
  return "text-[var(--color-muted-foreground)]";
}

function barFillClasses(level: ParentAttendanceSectionSummary["level"]): string {
  if (level === "ok") return "bg-[var(--color-success)]";
  if (level === "attention") return "bg-[var(--color-error)]";
  return "bg-[var(--color-muted-foreground)]";
}

export function ParentAttendancePwaSectionCard({
  summary,
  marks,
  locale,
  labels,
  showChildLabel,
}: ParentAttendancePwaSectionCardProps) {
  const panelId = useId();
  const [expanded, setExpanded] = useState(false);
  const { monthPercent, requiredMinPercent, level, sessionsThisMonth } = summary;
  const pctForBar = monthPercent ?? 0;

  const statusLabel =
    level === "ok"
      ? labels.sectionOnTrack
      : level === "attention"
        ? labels.sectionBelowTarget
        : labels.sectionUnknown;

  const sessionsLine =
    monthPercent != null
      ? formatSectionMonthLine(labels, monthPercent, sessionsThisMonth)
      : labels.sectionMonthUnknown;

  const toggleAria =
    marks.length > 0
      ? recentMarksToggleAria(labels, expanded, marks.length, summary.sectionName)
      : undefined;

  return (
    <article className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      {showChildLabel ? (
        <p className="mb-3 flex items-center gap-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/50 px-3 py-2 text-sm font-semibold text-[var(--color-foreground)]">
          <UserRound className="h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden />
          {parentAttendancePwaLabel(labels, "sectionChildLabel").replace("{{name}}", summary.studentName)}
        </p>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="text-base font-semibold text-[var(--color-foreground)]">
          {summary.sectionName || labels.sectionFallback}
        </h2>
        <span className={`text-xs font-bold uppercase tracking-wide ${levelClasses(level)}`}>
          {statusLabel}
        </span>
      </div>

      <div className="mt-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
          {parentAttendancePwaLabel(labels, "sectionAttendanceHeading")}
        </p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <p className="font-display text-3xl font-bold tabular-nums text-[var(--color-foreground)]">
            {monthPercent != null ? `${monthPercent}%` : "—"}
          </p>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {labels.sectionRequirementLine.replace("{{min}}", String(requiredMinPercent))}
          </p>
        </div>
        <div
          className="mt-3 h-2.5 overflow-hidden rounded-full bg-[var(--color-muted)]"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={monthPercent ?? 0}
          aria-label={sessionsLine}
        >
          <div
            className={`h-full rounded-full transition-[width] ${barFillClasses(level)}`}
            style={{ width: `${Math.min(100, pctForBar)}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-[var(--color-muted-foreground)]">{sessionsLine}</p>
      </div>

      {marks.length > 0 ? (
        <div className="mt-3 border-t border-[var(--color-border)] pt-3">
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={panelId}
            aria-label={toggleAria}
            onClick={() => setExpanded((v) => !v)}
            className="flex min-h-[44px] w-full items-center justify-between gap-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/35 px-3 py-2.5 text-left transition-colors hover:bg-[var(--color-muted)]/55"
          >
            <span className="text-sm font-semibold text-[var(--color-foreground)]">
              {labels.recentMarksTitle}
            </span>
            <span className="flex shrink-0 items-center gap-1.5">
              <span className="rounded-full bg-[var(--color-surface)] px-2 py-0.5 text-xs font-medium text-[var(--color-muted-foreground)]">
                {parentAttendancePwaLabel(labels, "recentMarksCount").replace(
                  "{{count}}",
                  String(marks.length),
                )}
              </span>
              <ChevronDown
                className={`h-4 w-4 text-[var(--color-muted-foreground)] transition-transform ${expanded ? "rotate-180" : ""}`}
                aria-hidden
              />
            </span>
          </button>

          {expanded ? (
            <ul
              id={panelId}
              className="mt-2 space-y-2 border-s-2 border-[var(--color-border)] ps-3"
              aria-label={labels.sectionMarksAria.replace("{section}", summary.sectionName)}
            >
              {marks.map((mark) => (
                <ParentAttendancePwaMarkRow
                  key={mark.markId}
                  mark={mark}
                  locale={locale}
                  labels={labels}
                />
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
