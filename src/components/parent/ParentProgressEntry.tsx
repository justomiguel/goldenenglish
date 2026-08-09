"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { ParentWardPicker, type ParentWardOption } from "@/components/parent/ParentWardPicker";
import { ParentRouteSurfaceGate } from "@/components/parent/ParentRouteSurfaceGate";
import { useAppSurface } from "@/hooks/useAppSurface";
import { ParentTasksListScreen } from "@/components/parent/ParentTasksListScreen";
import { ParentAssessmentsScreen } from "@/components/parent/ParentAssessmentsScreen";
import { ParentBadgesScreen } from "@/components/parent/ParentBadgesScreen";
import { ParentFeedbackSurface } from "@/components/parent/ParentFeedbackSurface";
import { StudentExamResultsSurface } from "@/components/parent/StudentExamResultsSurface";
import { ProgressSectionPicker } from "@/components/parent/ProgressSectionPicker";
import { ProgressSectionLoadFailed } from "@/components/parent/ProgressSectionLoadFailed";
import { ParentProgressEmptyState } from "@/components/parent/ParentProgressEmptyState";
import { buildProgressPickerOptions } from "@/components/parent/buildProgressPickerOptions";
import { sectionsForProgressPicker } from "@/components/parent/sectionsForProgressPicker";
import {
  buildProgressSections,
  type ProgressSectionId,
} from "@/lib/parent/buildProgressSections";
import {
  isProgressSectionId,
  resolveActiveProgressSection,
} from "@/lib/parent/resolveActiveProgressSection";
import { progressSectionLabel } from "@/lib/parent/formatProgressSectionLabels";
import { useProgressSectionsUnread } from "@/hooks/useProgressSectionsUnread";
import type { StudentLearningTaskRow } from "@/types/learningTasks";
import type { StudentMiniTestAssessment } from "@/types/learningContent";
import type { ParentFeedbackTimeline } from "@/types/parentFeedback";
import type { StudentExamResult } from "@/types/studentExams";
import type { StudentBadgeRowModel } from "@/components/student/StudentBadgesScreen";
import type { Dictionary } from "@/types/i18n";
import { PARENT_TOUR_ANCHORS } from "@/lib/parent-tutorials/selectors";

interface ParentProgressEntryProps {
  locale: string;
  wardOptions: ParentWardOption[];
  selectedStudentId: string | null;
  exams: StudentExamResult[];
  tasks: StudentLearningTaskRow[];
  assessments: StudentMiniTestAssessment[];
  feedback: ParentFeedbackTimeline;
  badgeRows: StudentBadgeRowModel[];
  /** Sections whose server read failed; offered with a retry rather than hidden as empty. */
  failedSections?: ProgressSectionId[];
  parentLabels: Dictionary["dashboard"]["parent"];
  studentLabels: Dictionary["dashboard"]["student"];
  badgesDict: Dictionary["dashboard"]["student"]["badges"];
  /** Route base for ward picker URL updates (defaults to parent progress). */
  progressBasePath?: string;
  /** The parent shell already renders the student selector, so this screen must not repeat it. */
  shellOwnsFocus?: boolean;
}

export function ParentProgressEntry({
  locale,
  wardOptions,
  selectedStudentId,
  exams,
  tasks,
  assessments,
  feedback,
  badgeRows,
  failedSections,
  parentLabels,
  studentLabels,
  badgesDict,
  progressBasePath,
  shellOwnsFocus = false,
}: ParentProgressEntryProps) {
  const searchParams = useSearchParams();
  const requestedFromUrl = searchParams.get("tab");
  const basePath = progressBasePath ?? `/${locale}/dashboard/parent/progress`;
  const surface = useAppSurface();
  const isNarrowParent = surface === "web-mobile" || surface === "pwa-mobile";
  const pickerCopy = parentLabels.progressPicker;

  const failedKey = (failedSections ?? []).join(",");
  const sections = useMemo(
    () =>
      buildProgressSections({
        exams,
        tasks,
        assessments,
        feedback,
        badgeRows,
        failedSections,
      }),
    // `failedSections` is a fresh array on every server render; its content is what matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [exams, tasks, assessments, feedback, badgeRows, failedKey],
  );
  const hasFailure = sections.some((section) => section.failed);

  // Picker choice is scoped to the current `?tab=` value so tour deep links win on navigation
  // without syncing URL → state inside an effect.
  const [pickerChoice, setPickerChoice] = useState<{
    urlTab: string | null;
    sectionId: string;
  } | null>(null);
  const requested =
    pickerChoice && pickerChoice.urlTab === requestedFromUrl
      ? pickerChoice.sectionId
      : requestedFromUrl;

  const activeSectionId = resolveActiveProgressSection(requested, sections);
  const pickerSections = sectionsForProgressPicker(sections, requested);

  const { unreadBySection } = useProgressSectionsUnread({
    studentId: selectedStudentId,
    sections,
    activeSectionId,
  });

  const options = buildProgressPickerOptions({
    sections: pickerSections,
    unreadBySection,
    copy: pickerCopy,
  });

  const panels: Record<string, ReactNode> = {
    exams: (
      <StudentExamResultsSurface locale={locale} exams={exams} copy={parentLabels.exams} />
    ),
    tasks: (
      <ParentTasksListScreen
        locale={locale}
        tasks={tasks}
        wardOptions={wardOptions}
        selectedStudentId={selectedStudentId}
        parentLabels={parentLabels}
        studentLabels={studentLabels}
        embedded
      />
    ),
    assessments: (
      <ParentAssessmentsScreen
        locale={locale}
        assessments={assessments}
        wardOptions={wardOptions}
        selectedStudentId={selectedStudentId}
        parentLabels={parentLabels}
        studentLabels={studentLabels}
        embedded
      />
    ),
    feedback: (
      <ParentFeedbackSurface locale={locale} timeline={feedback} copy={parentLabels.feedback} />
    ),
    badges: (
      <ParentBadgesScreen
        locale={locale}
        rows={badgeRows}
        wardOptions={wardOptions}
        selectedStudentId={selectedStudentId}
        parentLabels={parentLabels}
        badgesDict={badgesDict}
        embedded
      />
    ),
  };

  const activeFailed = sections.some(
    (section) => section.id === activeSectionId && section.failed,
  );
  const activePanel = activeFailed ? (
    <ProgressSectionLoadFailed copy={pickerCopy} />
  ) : activeSectionId ? (
    panels[activeSectionId]
  ) : null;
  const activeLabel = isProgressSectionId(activeSectionId)
    ? progressSectionLabel(activeSectionId, pickerCopy)
    : "";

  return (
    <ParentRouteSurfaceGate>
      <div className="space-y-4" data-tour={PARENT_TOUR_ANCHORS.childBody}>
        <header className="space-y-1" data-tour={PARENT_TOUR_ANCHORS.childTitle}>
          <h1 className="font-display text-2xl font-bold text-[var(--color-secondary)] sm:text-3xl">
            {parentLabels.progressPageTitle}
          </h1>
          {isNarrowParent ? null : (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              {parentLabels.progressPageLead}
            </p>
          )}
        </header>

        {hasFailure ? (
          <p
            role="status"
            className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/40 px-3 py-2 text-sm text-[var(--color-muted-foreground)]"
          >
            {pickerCopy.loadFailedBanner}
          </p>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          {shellOwnsFocus ? null : (
            <ParentWardPicker
              options={wardOptions}
              selectedStudentId={selectedStudentId}
              label={parentLabels.wardPickerLabel}
              hint={parentLabels.wardPickerHint}
              basePath={basePath}
              variant={isNarrowParent ? "pwa" : "default"}
              selectId="parent-progress-ward-picker"
            />
          )}
          {options.length > 0 ? (
            <ProgressSectionPicker
              options={options}
              value={activeSectionId}
              onChange={(sectionId) =>
                setPickerChoice({ urlTab: requestedFromUrl, sectionId })
              }
              copy={pickerCopy}
            />
          ) : null}
        </div>

        {activePanel ? (
          <section
            key={activeSectionId}
            aria-label={activeLabel}
            className="min-w-0 pt-1"
          >
            {activePanel}
          </section>
        ) : (
          <ParentProgressEmptyState copy={pickerCopy} />
        )}
      </div>
    </ParentRouteSurfaceGate>
  );
}
