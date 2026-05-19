"use client";

import { useId, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { Award, BookOpenCheck, ClipboardCheck, ScrollText } from "lucide-react";
import {
  UnderlineTabBar,
  underlinePanelId,
  underlineTabId,
  type UnderlineTabItem,
} from "@/components/molecules/UnderlineTabBar";
import { ParentWardPicker, type ParentWardOption } from "@/components/parent/ParentWardPicker";
import { ParentRouteSurfaceGate } from "@/components/parent/ParentRouteSurfaceGate";
import { useAppSurface } from "@/hooks/useAppSurface";
import { ParentTasksListScreen } from "@/components/parent/ParentTasksListScreen";
import { ParentAssessmentsScreen } from "@/components/parent/ParentAssessmentsScreen";
import { ParentBadgesScreen } from "@/components/parent/ParentBadgesScreen";
import { ParentLearningFeedbackPanel } from "@/components/parent/ParentLearningFeedbackPanel";
import type { StudentLearningTaskRow } from "@/types/learningTasks";
import type { StudentMiniTestAssessment } from "@/types/learningContent";
import type { ParentLearningFeedbackRow } from "@/lib/learning-content/loadParentLearningFeedback";
import type { StudentBadgeRowModel } from "@/components/student/StudentBadgesScreen";
import type { Dictionary } from "@/types/i18n";

export const PARENT_PROGRESS_TAB_TASKS = "tasks";
export const PARENT_PROGRESS_TAB_ASSESSMENTS = "assessments";
export const PARENT_PROGRESS_TAB_FEEDBACK = "feedback";
export const PARENT_PROGRESS_TAB_BADGES = "badges";

interface ParentProgressEntryProps {
  locale: string;
  wardOptions: ParentWardOption[];
  selectedStudentId: string | null;
  tasks: StudentLearningTaskRow[];
  assessments: StudentMiniTestAssessment[];
  feedback: ParentLearningFeedbackRow[];
  badgeRows: StudentBadgeRowModel[];
  parentLabels: Dictionary["dashboard"]["parent"];
  studentLabels: Dictionary["dashboard"]["student"];
  badgesDict: Dictionary["dashboard"]["student"]["badges"];
  navDict: Dictionary["dashboard"]["parentNav"];
}

export function ParentProgressEntry({
  locale,
  wardOptions,
  selectedStudentId,
  tasks,
  assessments,
  feedback,
  badgeRows,
  parentLabels,
  studentLabels,
  badgesDict,
  navDict,
}: ParentProgressEntryProps) {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") ?? PARENT_PROGRESS_TAB_TASKS;
  const reactId = useId().replace(/:/g, "");
  const idPrefix = `parent-progress-${reactId}`;
  const [tab, setTab] = useState<string>(initialTab);
  const basePath = `/${locale}/dashboard/parent/progress`;
  const surface = useAppSurface();
  const isNarrowParent = surface === "web-mobile" || surface === "pwa-mobile";

  const items: UnderlineTabItem[] = useMemo(
    () => [
      { id: PARENT_PROGRESS_TAB_TASKS, label: navDict.tasks, Icon: BookOpenCheck },
      { id: PARENT_PROGRESS_TAB_ASSESSMENTS, label: navDict.assessments, Icon: ClipboardCheck },
      { id: PARENT_PROGRESS_TAB_FEEDBACK, label: parentLabels.progressFeedbackTab, Icon: ScrollText },
      { id: PARENT_PROGRESS_TAB_BADGES, label: navDict.badges, Icon: Award },
    ],
    [navDict, parentLabels.progressFeedbackTab],
  );

  const panel = (id: string, content: ReactNode) => (
    <div
      id={underlinePanelId(idPrefix, id)}
      role="tabpanel"
      aria-labelledby={underlineTabId(idPrefix, id)}
      hidden={tab !== id}
      className="min-w-0 pt-4"
    >
      {content}
    </div>
  );

  return (
    <ParentRouteSurfaceGate>
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="font-display text-2xl font-bold text-[var(--color-secondary)] sm:text-3xl">
          {parentLabels.progressPageTitle}
        </h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">{parentLabels.progressPageLead}</p>
      </header>

      <ParentWardPicker
        options={wardOptions}
        selectedStudentId={selectedStudentId}
        label={parentLabels.wardPickerLabel}
        hint={parentLabels.wardPickerHint}
        basePath={basePath}
        variant={isNarrowParent ? "pwa" : "default"}
        selectId="parent-progress-ward-picker"
      />

      <UnderlineTabBar
        idPrefix={idPrefix}
        ariaLabel={parentLabels.progressTabsAria}
        items={items}
        value={tab}
        onChange={setTab}
      />

      {panel(
        PARENT_PROGRESS_TAB_TASKS,
        <ParentTasksListScreen
          locale={locale}
          tasks={tasks}
          wardOptions={wardOptions}
          selectedStudentId={selectedStudentId}
          parentLabels={parentLabels}
          studentLabels={studentLabels}
          embedded
        />,
      )}
      {panel(
        PARENT_PROGRESS_TAB_ASSESSMENTS,
        <ParentAssessmentsScreen
          locale={locale}
          assessments={assessments}
          wardOptions={wardOptions}
          selectedStudentId={selectedStudentId}
          parentLabels={parentLabels}
          studentLabels={studentLabels}
          embedded
        />,
      )}
      {panel(
        PARENT_PROGRESS_TAB_FEEDBACK,
        <ParentLearningFeedbackPanel
          rows={feedback}
          labels={parentLabels}
          selectedStudentId={selectedStudentId ?? undefined}
        />,
      )}
      {panel(
        PARENT_PROGRESS_TAB_BADGES,
        <ParentBadgesScreen
          locale={locale}
          rows={badgeRows}
          wardOptions={wardOptions}
          selectedStudentId={selectedStudentId}
          parentLabels={parentLabels}
          badgesDict={badgesDict}
          embedded
        />,
      )}
    </div>
    </ParentRouteSurfaceGate>
  );
}
