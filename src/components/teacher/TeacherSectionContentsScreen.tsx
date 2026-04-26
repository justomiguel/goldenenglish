"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Save } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import {
  createLiveLessonAction,
  setStudentReadinessAction,
} from "@/app/[locale]/dashboard/teacher/sections/[sectionId]/contents/actions";
import { TeacherAssessmentAttemptsPanel } from "@/components/teacher/TeacherAssessmentAttemptsPanel";
import { ContentPlanHealthSummary } from "@/components/molecules/ContentPlanHealthSummary";
import type { LearningRouteWorkspace } from "@/lib/learning-content/loadLearningRouteWorkspace";
import type { Dictionary } from "@/types/i18n";
import type { TeacherAssessmentAttemptReview } from "@/types/learningContent";

export type TeacherContentStudent = { id: string; label: string };

interface TeacherSectionContentsScreenProps {
  locale: string;
  sectionId: string;
  workspace: LearningRouteWorkspace;
  students: TeacherContentStudent[];
  attempts: TeacherAssessmentAttemptReview[];
  labels: Dictionary["dashboard"]["teacherContent"];
}

export function TeacherSectionContentsScreen({
  locale,
  sectionId,
  workspace,
  students,
  attempts,
  labels,
}: TeacherSectionContentsScreenProps) {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">{labels.title}</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{labels.lead}</p>
      </header>
      {workspace.route ? <ContentPlanHealthSummary health={workspace.health} labels={labels} /> : null}
      <TeacherRouteSummary workspace={workspace} labels={labels} />
      <div className="grid gap-6 lg:grid-cols-2">
        <LiveLessonForm locale={locale} sectionId={sectionId} workspace={workspace} labels={labels} />
        <ReadinessForm locale={locale} sectionId={sectionId} students={students} labels={labels} />
      </div>
      <TeacherAssessmentAttemptsPanel
        locale={locale}
        sectionId={sectionId}
        attempts={attempts}
        labels={labels}
      />
    </div>
  );
}

function TeacherRouteSummary({
  workspace,
  labels,
}: {
  workspace: LearningRouteWorkspace;
  labels: Dictionary["dashboard"]["teacherContent"];
}) {
  const route = workspace.route;
  if (!route) {
    return (
      <section className="space-y-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-4 shadow-[var(--shadow-card)]">
        <h2 className="text-lg font-semibold text-[var(--color-foreground)]">{labels.freeFlowTitle}</h2>
        <p className="text-sm text-[var(--color-muted-foreground)]">{labels.freeFlowLead}</p>
      </section>
    );
  }
  return (
    <section className="space-y-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-4 shadow-[var(--shadow-card)]">
      <h2 className="text-lg font-semibold text-[var(--color-foreground)]">{route.title}</h2>
      <ReadOnlyBlock label={labels.teacherObjectives} value={route.teacherObjectives} />
      <ReadOnlyBlock label={labels.generalScope} value={route.generalScope} />
      <ReadOnlyBlock label={labels.evaluationCriteria} value={route.evaluationCriteria} />
    </section>
  );
}

function ReadOnlyBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <h3 className="text-sm font-medium text-[var(--color-foreground)]">{label}</h3>
      <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--color-muted-foreground)]">{value || "—"}</p>
    </div>
  );
}

function TextBlock({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-sm font-medium text-[var(--color-foreground)]">
      {label}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 min-h-20 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
      />
    </label>
  );
}

function LiveLessonForm({
  locale,
  sectionId,
  workspace,
  labels,
}: {
  locale: string;
  sectionId: string;
  workspace: LearningRouteWorkspace;
  labels: Dictionary["dashboard"]["teacherContent"];
}) {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [routeStepIds, setRouteStepIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  return (
    <section className="space-y-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h2 className="text-lg font-semibold text-[var(--color-foreground)]">{labels.liveLessonTitle}</h2>
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={labels.liveLessonNamePlaceholder} />
      <TextBlock label={labels.liveLessonSummary} value={summary} onChange={setSummary} />
      <select
        multiple
        value={routeStepIds}
        onChange={(e) => setRouteStepIds([...e.currentTarget.selectedOptions].map((o) => o.value))}
        className="min-h-28 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
      >
        {workspace.routeSteps.map((step) => <option key={step.id} value={step.id}>{step.contentTitle}</option>)}
      </select>
      <Button
        type="button"
        isLoading={isPending}
        disabled={!title.trim()}
        onClick={() => startTransition(() => void createLiveLessonAction({ locale, sectionId, title, summary, routeStepIds }))}
      >
        <Save className="h-4 w-4" aria-hidden />
        {labels.saveLiveLesson}
      </Button>
    </section>
  );
}

function ReadinessForm({
  locale,
  sectionId,
  students,
  labels,
}: Pick<TeacherSectionContentsScreenProps, "locale" | "sectionId" | "students" | "labels">) {
  const [studentId, setStudentId] = useState(students[0]?.id ?? "");
  const [teacherApproved, setTeacherApproved] = useState(true);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();
  return (
    <section className="space-y-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h2 className="text-lg font-semibold text-[var(--color-foreground)]">{labels.readinessTitle}</h2>
      <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm">
        {students.map((student) => <option key={student.id} value={student.id}>{student.label}</option>)}
      </select>
      <label className="flex items-center gap-2 text-sm text-[var(--color-foreground)]">
        <input type="checkbox" checked={teacherApproved} onChange={(e) => setTeacherApproved(e.target.checked)} />
        {labels.readyCheckbox}
      </label>
      <TextBlock label={labels.readinessReason} value={reason} onChange={setReason} />
      <Button
        type="button"
        isLoading={isPending}
        disabled={!studentId}
        onClick={() => startTransition(() => void setStudentReadinessAction({ locale, sectionId, studentId, teacherApproved, reason, failedAttempt: !teacherApproved }))}
      >
        <CheckCircle2 className="h-4 w-4" aria-hidden />
        {labels.saveReadiness}
      </Button>
    </section>
  );
}
