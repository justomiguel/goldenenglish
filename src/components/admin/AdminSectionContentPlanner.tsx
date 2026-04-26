"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import {
  createLearningAssessmentAction,
  createPlannedLessonAction,
  createQuestionBankItemAction,
  saveSectionContentPlanAction,
} from "@/app/[locale]/dashboard/admin/academic/contents/actions";
import { ContentPlanHealthSummary } from "@/components/molecules/ContentPlanHealthSummary";
import type { ContentSectionOption, SectionContentPlanModel } from "@/types/learningContent";
import type { SectionContentWorkspace } from "@/lib/learning-content/loadSectionContentWorkspace";
import type { Dictionary } from "@/types/i18n";

interface AdminSectionContentPlannerProps {
  locale: string;
  sections: ContentSectionOption[];
  selectedSectionId: string | null;
  workspace: SectionContentWorkspace | null;
  labels: Dictionary["dashboard"]["adminContents"];
}

export function AdminSectionContentPlanner({
  locale,
  sections,
  selectedSectionId,
  workspace,
  labels,
}: AdminSectionContentPlannerProps) {
  const selected = selectedSectionId ?? sections[0]?.id ?? "";
  const plan = workspace?.plan ?? null;
  return (
    <div className="space-y-5 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-4 shadow-[var(--shadow-card)]">
      <header>
        <h2 className="text-xl font-semibold text-[var(--color-foreground)]">{labels.sectionPlanCtaTitle}</h2>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{labels.sectionPlanCtaLead}</p>
      </header>
      <label className="block text-sm font-medium text-[var(--color-foreground)]">
        {labels.sectionLabel}
        <select
          value={selected}
          onChange={(e) => {
            window.location.href = `/${locale}/dashboard/admin/academic/contents?sectionId=${encodeURIComponent(e.target.value)}`;
          }}
          className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
        >
          {sections.map((section) => <option key={section.id} value={section.id}>{section.label}</option>)}
        </select>
      </label>
      {selected ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
          {workspace ? <div className="xl:col-span-2"><ContentPlanHealthSummary health={workspace.health} labels={labels} /></div> : null}
          <PlanEditor locale={locale} sectionId={selected} plan={plan} labels={labels} />
          <ContentSidePanel workspace={workspace} labels={labels} />
          <LessonAndAssessmentForms locale={locale} sectionId={selected} plan={plan} labels={labels} />
        </div>
      ) : <p className="text-sm text-[var(--color-muted-foreground)]">{labels.noSection}</p>}
    </div>
  );
}

function PlanEditor({ locale, sectionId, plan, labels }: {
  locale: string;
  sectionId: string;
  plan: SectionContentPlanModel | null;
  labels: Dictionary["dashboard"]["adminContents"];
}) {
  const [title, setTitle] = useState(plan?.title ?? "");
  const [teacherObjectives, setTeacherObjectives] = useState(plan?.teacherObjectives ?? "");
  const [generalScope, setGeneralScope] = useState(plan?.generalScope ?? "");
  const [evaluationCriteria, setEvaluationCriteria] = useState(plan?.evaluationCriteria ?? "");
  const [isPending, startTransition] = useTransition();
  return (
    <section className="space-y-4 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h3 className="text-lg font-semibold text-[var(--color-foreground)]">{labels.planTitle}</h3>
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={labels.planNamePlaceholder} />
      <TextBlock label={labels.teacherObjectives} value={teacherObjectives} onChange={setTeacherObjectives} />
      <TextBlock label={labels.generalScope} value={generalScope} onChange={setGeneralScope} />
      <TextBlock label={labels.evaluationCriteria} value={evaluationCriteria} onChange={setEvaluationCriteria} />
      <Button type="button" onClick={() => startTransition(() => void saveSectionContentPlanAction({ locale, sectionId, title, teacherObjectives, generalScope, evaluationCriteria }))} isLoading={isPending} disabled={!title.trim()}>
        {labels.savePlan}
      </Button>
    </section>
  );
}

function TextBlock({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-sm font-medium text-[var(--color-foreground)]">
      {label}
      <textarea value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 min-h-24 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm" />
    </label>
  );
}

function ContentSidePanel({ workspace, labels }: { workspace: SectionContentWorkspace | null; labels: Dictionary["dashboard"]["adminContents"] }) {
  return (
    <aside className="space-y-4 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <List title={labels.lessonsTitle} empty={labels.emptyLessons} rows={workspace?.plannedLessons.map((l) => l.title) ?? []} />
      <List title={labels.questionsTitle} empty={labels.emptyQuestions} rows={workspace?.questions.map((q) => q.prompt) ?? []} />
      <List title={labels.assessmentsTitle} empty={labels.emptyAssessments} rows={workspace?.assessments.map((a) => a.title) ?? []} />
    </aside>
  );
}

function List({ title, empty, rows }: { title: string; empty: string; rows: string[] }) {
  const visible = useMemo(() => rows.slice(0, 6), [rows]);
  return (
    <section>
      <h3 className="font-semibold text-[var(--color-foreground)]">{title}</h3>
      {visible.length === 0 ? <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">{empty}</p> : (
        <ul className="mt-2 space-y-1 text-sm text-[var(--color-muted-foreground)]">{visible.map((row, idx) => <li key={`${row}:${idx}`}>{row}</li>)}</ul>
      )}
    </section>
  );
}

function LessonAndAssessmentForms({ locale, sectionId, plan, labels }: {
  locale: string;
  sectionId: string;
  plan: SectionContentPlanModel | null;
  labels: Dictionary["dashboard"]["adminContents"];
}) {
  const [lessonTitle, setLessonTitle] = useState("");
  const [questionPrompt, setQuestionPrompt] = useState("");
  const [assessmentTitle, setAssessmentTitle] = useState("");
  const [isPending, startTransition] = useTransition();
  return (
    <section className="space-y-4 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 xl:col-span-2">
      <h3 className="text-lg font-semibold text-[var(--color-foreground)]">{labels.builderTitle}</h3>
      <div className="grid gap-3 md:grid-cols-3">
        <MiniForm title={labels.addLesson} value={lessonTitle} onChange={setLessonTitle} onSubmit={() => plan?.id && startTransition(() => void createPlannedLessonAction({ locale, planId: plan.id, title: lessonTitle, sortOrder: 0 }))} disabled={!plan?.id || isPending} labels={labels} />
        <MiniForm title={labels.addQuestion} value={questionPrompt} onChange={setQuestionPrompt} onSubmit={() => startTransition(() => void createQuestionBankItemAction({ sectionId, prompt: questionPrompt, questionType: "true_false" }))} disabled={isPending} labels={labels} />
        <MiniForm title={labels.addAssessment} value={assessmentTitle} onChange={setAssessmentTitle} onSubmit={() => startTransition(() => void createLearningAssessmentAction({ sectionId, title: assessmentTitle, assessmentKind: "entry", gradingMode: "diagnostic" }))} disabled={isPending} labels={labels} />
      </div>
    </section>
  );
}

function MiniForm({ title, value, onChange, onSubmit, disabled, labels }: {
  title: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
  labels: Dictionary["dashboard"]["adminContents"];
}) {
  return (
    <div className="space-y-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] p-3">
      <h4 className="font-medium text-[var(--color-foreground)]">{title}</h4>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
      <Button type="button" size="sm" onClick={onSubmit} disabled={disabled || !value.trim()}>{labels.add}</Button>
    </div>
  );
}
