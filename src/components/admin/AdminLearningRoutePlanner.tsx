"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus, Save } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import {
  addLearningRouteStepAction,
  createQuestionBankItemAction,
  saveLearningRouteAction,
} from "@/app/[locale]/dashboard/admin/academic/contents/actions";
import { ContentPlanHealthSummary } from "@/components/molecules/ContentPlanHealthSummary";
import type { LearningRouteModel } from "@/types/learningContent";
import type { LearningRouteWorkspace } from "@/lib/learning-content/loadLearningRouteWorkspace";
import type { Dictionary } from "@/types/i18n";

interface AdminLearningRoutePlannerProps {
  locale: string;
  workspace: LearningRouteWorkspace | null;
  labels: Dictionary["dashboard"]["adminContents"];
}

export function AdminLearningRoutePlanner({
  locale,
  workspace,
  labels,
}: AdminLearningRoutePlannerProps) {
  const route = workspace?.route ?? null;
  return (
    <div className="space-y-5 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-4 shadow-[var(--shadow-card)]">
      <header>
        <h2 className="text-xl font-semibold text-[var(--color-foreground)]">{labels.learningRoutesTitle}</h2>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{labels.learningRoutesLead}</p>
      </header>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        {workspace ? <div className="xl:col-span-2"><ContentPlanHealthSummary health={workspace.health} labels={labels} /></div> : null}
        <RouteEditor locale={locale} route={route} labels={labels} />
        <ContentSidePanel workspace={workspace} labels={labels} />
        <RouteStepAndAssessmentForms locale={locale} route={route} workspace={workspace} labels={labels} />
      </div>
    </div>
  );
}

function RouteEditor({ locale, route, labels }: {
  locale: string;
  route: LearningRouteModel | null;
  labels: Dictionary["dashboard"]["adminContents"];
}) {
  const [title, setTitle] = useState(route?.title ?? "");
  const [teacherObjectives, setTeacherObjectives] = useState(route?.teacherObjectives ?? "");
  const [generalScope, setGeneralScope] = useState(route?.generalScope ?? "");
  const [evaluationCriteria, setEvaluationCriteria] = useState(route?.evaluationCriteria ?? "");
  const [isPending, startTransition] = useTransition();
  return (
    <section className="space-y-4 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h3 className="text-lg font-semibold text-[var(--color-foreground)]">{labels.routeEditorTitle}</h3>
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={labels.routeNamePlaceholder} />
      <TextBlock label={labels.teacherObjectives} value={teacherObjectives} onChange={setTeacherObjectives} />
      <TextBlock label={labels.generalScope} value={generalScope} onChange={setGeneralScope} />
      <TextBlock label={labels.evaluationCriteria} value={evaluationCriteria} onChange={setEvaluationCriteria} />
      <Button
        type="button"
        onClick={() => startTransition(() => void saveLearningRouteAction({
          locale,
          routeId: route?.id ?? null,
          title,
          teacherObjectives,
          generalScope,
          evaluationCriteria,
        }))}
        isLoading={isPending}
        disabled={!title.trim()}
      >
        <Save className="h-4 w-4" aria-hidden />
        {labels.saveRoute}
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

function ContentSidePanel({ workspace, labels }: { workspace: LearningRouteWorkspace | null; labels: Dictionary["dashboard"]["adminContents"] }) {
  return (
    <aside className="space-y-4 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <List title={labels.routeStepsTitle} empty={labels.emptyRouteSteps} rows={workspace?.routeSteps.map((step) => step.contentTitle) ?? []} />
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

function RouteStepAndAssessmentForms({ locale, route, workspace, labels }: {
  locale: string;
  route: LearningRouteModel | null;
  workspace: LearningRouteWorkspace | null;
  labels: Dictionary["dashboard"]["adminContents"];
}) {
  const [contentTemplateId, setContentTemplateId] = useState(workspace?.contentTemplates[0]?.id ?? "");
  const [questionPrompt, setQuestionPrompt] = useState("");
  const [isPending, startTransition] = useTransition();
  return (
    <section className="space-y-4 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 xl:col-span-2">
      <h3 className="text-lg font-semibold text-[var(--color-foreground)]">{labels.routeBuilderTitle}</h3>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] p-3">
          <h4 className="font-medium text-[var(--color-foreground)]">{labels.addRouteStep}</h4>
          <select value={contentTemplateId} onChange={(e) => setContentTemplateId(e.target.value)} className="w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm">
            {workspace?.contentTemplates.map((template) => <option key={template.id} value={template.id}>{template.title}</option>)}
          </select>
          <Button type="button" size="sm" onClick={() => route?.id && startTransition(() => void addLearningRouteStepAction({ locale, routeId: route.id, contentTemplateId, sortOrder: workspace?.routeSteps.length ?? 0 }))} disabled={!route?.id || !contentTemplateId || isPending}>
            <Plus className="h-4 w-4" aria-hidden />
            {labels.add}
          </Button>
        </div>
        <MiniForm title={labels.addQuestion} value={questionPrompt} onChange={setQuestionPrompt} onSubmit={() => startTransition(() => void createQuestionBankItemAction({ prompt: questionPrompt, questionType: "true_false" }))} disabled={isPending} labels={labels} />
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
      <Button type="button" size="sm" onClick={onSubmit} disabled={disabled || !value.trim()}>
        <Plus className="h-4 w-4" aria-hidden />
        {labels.add}
      </Button>
    </div>
  );
}
