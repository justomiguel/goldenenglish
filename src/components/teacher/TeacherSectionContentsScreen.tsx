"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import {
  createLiveLessonAction,
  saveTeacherSectionContentPlanAction,
  setStudentReadinessAction,
} from "@/app/[locale]/dashboard/teacher/sections/[sectionId]/contents/actions";
import { TeacherAssessmentAttemptsPanel } from "@/components/teacher/TeacherAssessmentAttemptsPanel";
import { ContentPlanHealthSummary } from "@/components/molecules/ContentPlanHealthSummary";
import type { SectionContentWorkspace } from "@/lib/learning-content/loadSectionContentWorkspace";
import type { Dictionary } from "@/types/i18n";
import type { TeacherAssessmentAttemptReview } from "@/types/learningContent";

export type TeacherContentStudent = { id: string; label: string };

interface TeacherSectionContentsScreenProps {
  locale: string;
  sectionId: string;
  workspace: SectionContentWorkspace;
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
      <ContentPlanHealthSummary health={workspace.health} labels={labels} />
      <TeacherPlanEditor locale={locale} sectionId={sectionId} workspace={workspace} labels={labels} />
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

function TeacherPlanEditor({
  locale,
  sectionId,
  workspace,
  labels,
}: {
  locale: string;
  sectionId: string;
  workspace: SectionContentWorkspace;
  labels: Dictionary["dashboard"]["teacherContent"];
}) {
  const [title, setTitle] = useState(workspace.plan.title);
  const [teacherObjectives, setTeacherObjectives] = useState(workspace.plan.teacherObjectives);
  const [generalScope, setGeneralScope] = useState(workspace.plan.generalScope);
  const [evaluationCriteria, setEvaluationCriteria] = useState(workspace.plan.evaluationCriteria);
  const [isPending, startTransition] = useTransition();
  return (
    <section className="space-y-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-4 shadow-[var(--shadow-card)]">
      <h2 className="text-lg font-semibold text-[var(--color-foreground)]">{labels.planTitle}</h2>
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={labels.planNamePlaceholder} />
      <TextBlock label={labels.teacherObjectives} value={teacherObjectives} onChange={setTeacherObjectives} />
      <TextBlock label={labels.generalScope} value={generalScope} onChange={setGeneralScope} />
      <TextBlock label={labels.evaluationCriteria} value={evaluationCriteria} onChange={setEvaluationCriteria} />
      <Button
        type="button"
        isLoading={isPending}
        disabled={!title.trim()}
        onClick={() => startTransition(() => void saveTeacherSectionContentPlanAction({
          locale,
          sectionId,
          title,
          teacherObjectives,
          generalScope,
          evaluationCriteria,
        }))}
      >
        {labels.savePlan}
      </Button>
    </section>
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
  workspace: SectionContentWorkspace;
  labels: Dictionary["dashboard"]["teacherContent"];
}) {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [plannedLessonIds, setPlannedLessonIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  return (
    <section className="space-y-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h2 className="text-lg font-semibold text-[var(--color-foreground)]">{labels.liveLessonTitle}</h2>
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={labels.liveLessonNamePlaceholder} />
      <TextBlock label={labels.liveLessonSummary} value={summary} onChange={setSummary} />
      <select
        multiple
        value={plannedLessonIds}
        onChange={(e) => setPlannedLessonIds([...e.currentTarget.selectedOptions].map((o) => o.value))}
        className="min-h-28 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
      >
        {workspace.plannedLessons.map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.title}</option>)}
      </select>
      <Button
        type="button"
        isLoading={isPending}
        disabled={!title.trim()}
        onClick={() => startTransition(() => void createLiveLessonAction({ locale, sectionId, title, summary, plannedLessonIds }))}
      >
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
        {labels.saveReadiness}
      </Button>
    </section>
  );
}
